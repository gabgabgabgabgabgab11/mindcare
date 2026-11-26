import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/utils/accountLoader.ts',import.meta.url),'utf8');
const { outputText }=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const { createAccountLoader, retryAccountRequest }=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const deferred=()=>{ let resolve,reject; const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject}; };

test('temporary auth service/network failures recover without another login', async()=>{
  for (const failure of [{response:{status:503}}, {code:'ECONNABORTED'}, {response:{status:429}}]) {
    let calls=0;const waits=[];
    const result=await retryAccountRequest(async()=>{if(++calls<3)throw failure;return 'account';},async ms=>{waits.push(ms);});
    assert.equal(result,'account');assert.equal(calls,3);assert.deepEqual(waits,[750,1500]);
  }
});
test('account retries are bounded and do not retry rejected tokens or permissions', async()=>{
  for (const status of [401,403,400,503]) {
    let calls=0;
    await assert.rejects(retryAccountRequest(async()=>{calls++;throw {response:{status}};},async()=>{}));
    assert.equal(calls,status===503?3:1);
  }
});

test('bootstrap and auth event share the same account request',async()=>{
  let calls=0; const request=deferred();
  const loader=createAccountLoader(()=>{calls++;return request.promise;});
  const first=loader.load('session');const second=loader.load('session');
  assert.equal(first,second);assert.equal(calls,1);
  request.resolve({role:'student'});assert.deepEqual(await first,{role:'student'});
});
test('tab focus and refreshed tokens reuse the loaded account',async()=>{
  let calls=0;const loader=createAccountLoader(async()=>{calls++;return {role:'admin'};});
  await loader.load('session');await loader.load('session');await loader.load('session');
  assert.equal(calls,1);
});
test('a timed-out/failed load can be retried successfully',async()=>{
  let calls=0;const loader=createAccountLoader(async()=>{if(++calls===1)throw new Error('timeout');return 'ok';});
  await assert.rejects(loader.load('session'),/timeout/);
  assert.equal(loader.isLoaded('session'),false);
  assert.equal(await loader.load('session'),'ok');assert.equal(calls,2);
});
test('logout invalidates a pending load even for the same account',async()=>{
  const request=deferred();const loader=createAccountLoader(()=>request.promise);
  const old=loader.load('session');loader.clear();request.resolve('old');await old;
  assert.equal(loader.isLoaded('session'),false);
});
test('late response for a previous session cannot replace the new cached result',async()=>{
  const old=deferred();let calls=0;
  const loader=createAccountLoader(()=>++calls===1?old.promise:Promise.resolve('new'));
  const previous=loader.load('old');assert.equal(await loader.load('new'),'new');
  old.resolve('old');await previous;
  assert.equal(loader.isLoaded('new'),true);assert.equal(loader.isLoaded('old'),false);
});
test('auth notification callback stays synchronous to avoid Supabase lock re-entry',()=>{
  const context=readFileSync(new URL('../src/contexts/AuthContext.tsx',import.meta.url),'utf8');
  const file=ts.createSourceFile('AuthContext.tsx',context,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let inspected=0;
  function visit(node){
    if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&node.expression.name.text==='onAuthStateChange'){
      inspected++;const fn=node.arguments[0];
      assert.equal(fn.modifiers?.some(m=>m.kind===ts.SyntaxKind.AsyncKeyword)??false,false);
    }
    ts.forEachChild(node,visit);
  }
  visit(file);assert.equal(inspected,1);
});
