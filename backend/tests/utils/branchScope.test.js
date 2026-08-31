// FILE: backend/tests/utils/branchScope.test.js
const {
  getUserBranchIds,
  scopeFiltersToUserBranches,
  assertBranchAccess,
} = require('../../src/utils/branchScope');

const superAdmin = { roles: ['SUPER_ADMIN'], branches: [] };
const teacherBranch1 = { roles: ['TEACHER'], branches: [1] };
const teacherNoBranch = { roles: ['TEACHER'], branches: [] };

describe('getUserBranchIds()', () => {
  it('returns null (unrestricted) for SUPER_ADMIN', () => {
    expect(getUserBranchIds(superAdmin)).toBeNull();
  });

  it("returns the user's branch ids for non-super-admin roles", () => {
    expect(getUserBranchIds(teacherBranch1)).toEqual([1]);
  });
});

describe('scopeFiltersToUserBranches()', () => {
  it('does not restrict SUPER_ADMIN listings', () => {
    const scoped = scopeFiltersToUserBranches({ status: 'ACTIVE' }, superAdmin);
    expect(scoped.branchIds).toBeUndefined();
  });

  it('forces a branchIds filter for a scoped user with no explicit branchId', () => {
    // Regression test for hallazgo #3: previously, omitting branch_id from
    // a request meant "no restriction", which let a teacher in Sede
    // Principal see students from every branch via GET /students.
    const scoped = scopeFiltersToUserBranches({ status: 'ACTIVE' }, teacherBranch1);
    expect(scoped.branchIds).toEqual([1]);
  });

  it('rejects a requested branchId outside the user\'s own branches', () => {
    const scoped = scopeFiltersToUserBranches({ branchId: 2 }, teacherBranch1);
    // Should not fall back to "no filter" - must resolve to an
    // impossible branch id so the query returns nothing.
    expect(scoped.branchIds).toEqual([-1]);
  });

  it('gives a branch-less user a filter that matches nothing', () => {
    const scoped = scopeFiltersToUserBranches({}, teacherNoBranch);
    expect(scoped.branchIds).toEqual([-1]);
  });
});

describe('assertBranchAccess()', () => {
  it('lets SUPER_ADMIN access any record', () => {
    const record = { id: 5, branch_id: 2 };
    expect(assertBranchAccess(record, superAdmin)).toBe(record);
  });

  it('lets a user access a record in their own branch', () => {
    const record = { id: 5, branch_id: 1 };
    expect(assertBranchAccess(record, teacherBranch1)).toBe(record);
  });

  it('blocks cross-branch access to a record in another branch', () => {
    // Regression test for hallazgo #3: a teacher fixed to Sede Principal
    // (branch_id 1) editing a student from Sede Norte (branch_id 2) by
    // omitting branch_id from the request body used to succeed silently.
    const studentFromOtherBranch = { id: 5, branch_id: 2 };
    expect(() => assertBranchAccess(studentFromOtherBranch, teacherBranch1)).toThrow();
  });

  it('treats a missing record the same as a cross-branch record (404, not 403)', () => {
    expect(() => assertBranchAccess(null, teacherBranch1)).toThrow('not found');
  });
});
