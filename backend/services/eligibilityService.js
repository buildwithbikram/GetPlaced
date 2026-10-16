const checkEligibility = (student, job) => {
  const reasons = [];
  const missingSkills = [];

  // 1. Check CGPA
  if (student.cgpa == null) {
    reasons.push('Please add your CGPA to your profile.');
  } else if (student.cgpa < job.minimumCgpa) {
    reasons.push(
      `Your CGPA is below the required ${job.minimumCgpa}.`
    );
  }

  // 2. Check backlogs
  if (student.backlogs == null) {
    reasons.push('Please add your backlog information.');
  } else if (student.backlogs > job.maximumBacklogs) {
    reasons.push(
      `Your backlogs exceed the maximum allowed ${job.maximumBacklogs}.`
    );
  }

  // 3. Check eligible branches
  if (
    job.eligibleBranches.length > 0 &&
    !job.eligibleBranches.some(
      branch =>
        branch.toLowerCase() === student.branch?.trim().toLowerCase()
    )
  ) {
    reasons.push('Your branch is not eligible for this job.');
  }

  // 4. Check graduation year
  if (
    job.eligibleGraduationYears.length > 0 &&
    !job.eligibleGraduationYears.includes(student.graduationYear)
  ) {
    reasons.push('Your graduation year is not eligible.');
  }

  // 5. Check required skills
  const studentSkills = (student.skills || []).map(skill =>
    skill.trim().toLowerCase()
  );

  for (const skill of job.requiredSkills || []) {
    if (!studentSkills.includes(skill.trim().toLowerCase())) {
      missingSkills.push(skill);
    }
  }

  if (missingSkills.length > 0) {
    reasons.push(
      `Missing required skills: ${missingSkills.join(', ')}.`
    );
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    missingSkills
  };
};

module.exports = { checkEligibility };