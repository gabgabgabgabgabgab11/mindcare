# app/core/section_catalog.py
#
# Edit this dict when your institution's section structure changes
# (e.g. at the start of a new academic year). Keys are program codes as
# stored on Profile.program; values map year_level (1-4) to the list of
# valid section labels for that year in that program.
#
# This is the SINGLE SOURCE OF TRUTH for what counts as a valid
# program + year_level + section combination. The profile-update
# endpoint validates against this; the frontend's section dropdown is
# populated from this via the /section-options endpoint.

SECTION_CATALOG: dict[str, dict[int, list[str]]] = {
    "BSIT": {
        1: ["A", "B", "C"],
        2: ["A", "B", "C"],
        3: ["A", "B"],
        4: ["A", "B"],
    },
    "BSCS": {
        1: ["A", "B"],
        2: ["A", "B"],
        3: ["A"],
        4: ["A"],
    },
    # Add additional programs here following the same shape.
}

# Programs that students may select on their profile before their year and
# section have been assigned. Section combinations remain governed by the
# catalog above.
PROGRAM_OPTIONS = (
    "BSIT",
    "BSCpE",
    "BSHM",
    "BSA",
    "BSENTREP",
    "BSEDEN",
    "DSEDMT",
    "DOMTLOM",
)


def get_valid_sections(program: str, year_level: int) -> list[str]:
    """Returns the valid section list for a program/year_level pair,
    or an empty list if the combination is not recognized."""
    return SECTION_CATALOG.get(program, {}).get(year_level, [])


def is_valid_combination(program: str, year_level: int, section: str) -> bool:
    """Returns True if the given section is valid for the program and year level."""
    return section in get_valid_sections(program, year_level)
