const Salary = require('../models/salaryModel');

// Step 2: Modify Salary controller
const SalaryController = {
    createSalary: async (uid, salaryAmount, salaryFrequency, nextPaymentDate, frequencyLimit) => {
      const salary = new Salary({ uid, salaryAmount, salaryFrequency, nextPaymentDate, frequencyLimit });
      await salary.save();
    },
  
    updateSalary: async (uid, salaryAmount, salaryFrequency, nextPaymentDate, frequencyLimit) => {
      await Salary.updateOne({ uid }, { salaryAmount, salaryFrequency, nextPaymentDate, frequencyLimit });
    },
  
    deleteSalary: async (uid) => {
      await Salary.deleteOne({ uid });
    },
};

// export function to be used in other files
module.exports = SalaryController;

  // export function to be used in other files

module.exports = SalaryController;
