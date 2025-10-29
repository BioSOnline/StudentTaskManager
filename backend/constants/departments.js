// MITE College Departments
const DEPARTMENTS = {
  CSE: {
    name: "Computer Science and Engineering",
    code: "CSE"
  },
  ECE: {
    name: "Electronics and Communication Engineering",
    code: "ECE"
  },
  ME: {
    name: "Mechanical Engineering",
    code: "ME"
  },
  CE: {
    name: "Civil Engineering",
    code: "CE"
  },
  EEE: {
    name: "Electrical and Electronics Engineering",
    code: "EEE"
  },
  ISE: {
    name: "Information Science and Engineering",
    code: "ISE"
  }
};

const YEARS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" }
];

const SEMESTERS = [
  { value: "1", label: "1st Semester" },
  { value: "2", label: "2nd Semester" },
  { value: "3", label: "3rd Semester" },
  { value: "4", label: "4th Semester" },
  { value: "5", label: "5th Semester" },
  { value: "6", label: "6th Semester" },
  { value: "7", label: "7th Semester" },
  { value: "8", label: "8th Semester" }
];

module.exports = {
  DEPARTMENTS,
  YEARS,
  SEMESTERS
};