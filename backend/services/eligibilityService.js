  const checkEligibility = (student, job) => {
  const reasons = [];
  const missingSkills = [];

  if (student.cgpa == null) {
    reasons.push('Please add your CGPA to your profile.');
  } else if (student.cgpa < job.minimumCgpa) {
    reasons.push(
      `Your CGPA is below the required ${job.minimumCgpa}.`
    );
  }

  if (student.backlogs == null) {
    reasons.push('Please add your backlog information.');
  } else if (student.backlogs > job.maximumBacklogs) {
    reasons.push(
      `Your backlogs exceed the maximum allowed ${job.maximumBacklogs}.`
    );
  }

  
const eligibleBranches = job.eligibleBranches || [];

if (
  eligibleBranches.length > 0 &&
  !eligibleBranches.some(
    branch =>
      branch.toLowerCase() === student.branch?.trim().toLowerCase()
  )
) {
  reasons.push('Your branch is not eligible for this job.');
}

const eligibleGraduationYears =
  job.eligibleGraduationYears || [];

if (
  eligibleGraduationYears.length > 0 &&
  !eligibleGraduationYears.includes(student.graduationYear)
) {
  reasons.push('Your graduation year is not eligible.');
}


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