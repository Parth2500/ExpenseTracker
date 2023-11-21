// routes.js

/**
 * @module routes
 */

/**
 * Load environment variables from .env file.
 * @requires dotenv
 */
require("dotenv").config();

/**
 * Mongoose library for MongoDB interactions.
 * @external mongoose
 * @see {@link https://mongoosejs.com/}
 */
const mongoose = require("mongoose");

/**
 * Express.js module for building web applications.
 * @external express
 * @see {@link https://expressjs.com/}
 */
const express = require("express");

/**
 * Express router for defining routes.
 * @type {external:express.Router}
 */
const router = express.Router();

const Models = require("./models");
const Transaction = Models.Transaction;
const BankAccount = Models.BankAccount;
const Debt = Models.Debt;

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Operations related to transactions.
 */

// Expense Transaction
/**
 * Adds a new expense transaction.
 * @function
 * @swagger
 * tags:
 *   - Transactions
 * @name POST /transactions/expense
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - JSON response indicating success or failure.
 */
router.post("/transactions/expense", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { description, amount, category, date, sourceAccount } = req.body;

    // Validate required fields
    if (!description || !amount || !sourceAccount) {
      throw new Error(
        "Description, amount, and sourceAccount are required fields."
      );
    }

    // Create a new Expense
    const newExpense = new Transaction({
      description,
      amount,
      category,
      date,
      type: "expense",
      sourceAccount,
    });

    // Save the expense to the database within the transaction
    const savedExpense = await newExpense.save({ session });

    // Update the source account balance
    const sourceAccountObject = await BankAccount.findById(
      sourceAccount
    ).session(session);
    if (!sourceAccountObject) {
      throw new Error("Source account not found.");
    }

    sourceAccountObject.balance -= amount;
    await sourceAccountObject.save();

    await session.commitTransaction();

    res.json({
      message: "Expense added successfully",
      transaction: savedExpense,
    });
  } catch (error) {
    console.error("Error adding expense:", error.message);
    await session.abortTransaction();
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    session.endSession();
  }
});

// Income Transaction
/**
 * Adds a new income transaction.
 * @function
 * @swagger
 * tags:
 *   - Transactions
 * @name POST /transactions/income
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - JSON response indicating success or failure.
 */
router.post("/transactions/income", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { description, amount, category, date, destinationAccount } =
      req.body;

    // Validate required fields
    if (!description || !amount || !destinationAccount) {
      throw new Error(
        "Description, amount, and destinationAccount are required fields."
      );
    }

    // Create a new Income
    const newIncome = new Transaction({
      description,
      amount,
      category,
      date,
      type: "income",
      destinationAccount,
    });

    // Save the income to the database within the transaction
    const savedIncome = await newIncome.save({ session });

    // Update the destination account balance
    const destinationAccountObject = await BankAccount.findById(
      destinationAccount
    ).session(session);
    if (!destinationAccountObject) {
      throw new Error("Destination account not found.");
    }

    destinationAccountObject.balance += amount;
    await destinationAccountObject.save();

    await session.commitTransaction();

    res.json({
      message: "Income added successfully",
      transaction: savedIncome,
    });
  } catch (error) {
    console.error("Error adding income:", error.message);
    await session.abortTransaction();
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    session.endSession();
  }
});

// Self Transfer Transaction
/**
 * Performs a self-transfer between two bank accounts.
 * @function
 * @swagger
 * tags:
 *   - Transactions
 * @name POST /transactions/self-transfer
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - JSON response indicating success or failure.
 */
router.post("/transactions/self-transfer", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, sourceAccount, destinationAccount, description } = req.body;

    // Validate required fields
    if (!amount || !sourceAccount || !destinationAccount) {
      throw new Error(
        "Amount, sourceAccount, and destinationAccount are required fields."
      );
    }

    // Create a new Self Transfer
    const selfTransaction = new Transaction({
      amount,
      type: "self-transfer",
      sourceAccount,
      destinationAccount,
      description,
    });

    // Save the self transfer transaction to the database within the transaction
    const savedSelfTransaction = await selfTransaction.save({ session });

    // Update the source account balance
    const sourceAccountObject = await BankAccount.findById(
      sourceAccount
    ).session(session);
    if (!sourceAccountObject) {
      throw new Error("Source account not found.");
    }

    sourceAccountObject.balance -= amount;
    await sourceAccountObject.save();

    // Update the destination account balance
    const destinationAccountObject = await BankAccount.findById(
      destinationAccount
    ).session(session);
    if (!destinationAccountObject) {
      throw new Error("Destination account not found.");
    }

    destinationAccountObject.balance += amount;
    await destinationAccountObject.save();

    await session.commitTransaction();

    res.json({
      message: "Self-transfer completed successfully",
      selfTransferTransaction: savedSelfTransaction,
    });
  } catch (error) {
    console.error("Error performing self-transfer:", error.message);
    await session.abortTransaction();
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    session.endSession();
  }
});

/**
 * @swagger
 * tags:
 *   name: Bank Accounts
 *   description: Operations related to bank accounts.
 */

// Get All Bank Accounts
/**
 * Retrieves all bank accounts.
 * @function
 * @swagger
 * tags:
 *   - Bank Accounts
 * @name GET /bank-accounts
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - JSON response containing the list of bank accounts.
 */
router.get("/bank-accounts", async (req, res) => {
  try {
    const bankAccounts = await BankAccount.find();
    res.json(bankAccounts);
  } catch (error) {
    console.error("Error retrieving bank accounts:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get a Specific Bank Account
/**
 * Retrieves a specific bank account by its ID.
 * @function
 * @swagger
 * tags:
 *   - Bank Accounts
 * @name GET /bank-accounts/:accountId
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - JSON response containing the details of the specified bank account.
 */
router.get("/bank-accounts/:accountId", async (req, res) => {
  const { accountId } = req.params;

  try {
    const bankAccount = await BankAccount.findById(accountId);
    if (!bankAccount) {
      return res.status(404).json({ error: "Bank account not found." });
    }

    res.json(bankAccount);
  } catch (error) {
    console.error("Error retrieving bank account:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create a New Bank Account
/**
 * Creates a new bank account.
 * @function
 * @name POST /bank-accounts
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - JSON response indicating success or failure.
 */
router.post("/bank-accounts", async (req, res) => {
  const { accountNumber } = req.body;

  try {
    // Validate required fields
    if (!accountNumber) {
      return res
        .status(400)
        .json({ error: "Account number is a required field." });
    }

    // Check if the account number is unique
    const existingAccount = await BankAccount.findOne({ accountNumber });
    if (existingAccount) {
      return res.status(400).json({
        error: "Account with the same account number already exists.",
      });
    }

    // Create a new BankAccount
    const newBankAccount = new BankAccount({
      accountNumber,
      balance: 0,
    });

    // Save the bank account to the database
    const savedBankAccount = await newBankAccount.save();

    res.status(201).json({
      message: "Bank account created successfully",
      bankAccount: savedBankAccount,
    });
  } catch (error) {
    console.error("Error creating bank account:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update Bank Account Balance
/**
 * Updates the balance of a specific bank account.
 * @function
 * @name PATCH /bank-accounts/:accountId/update-balance
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - JSON response indicating success or failure.
 */
router.patch("/bank-accounts/:accountId/update-balance", async (req, res) => {
  const { accountId } = req.params;
  const { newBalance } = req.body;

  try {
    // Validate required fields
    if (!newBalance || isNaN(newBalance)) {
      return res
        .status(400)
        .json({ error: "New balance must be a valid number." });
    }

    // Find the bank account by ID
    const bankAccount = await BankAccount.findById(accountId);
    if (!bankAccount) {
      return res.status(404).json({ error: "Bank account not found." });
    }

    // Update the balance of the bank account
    bankAccount.balance = newBalance;
    await bankAccount.save();

    res.json({
      message: "Bank account balance updated successfully",
      bankAccount,
    });
  } catch (error) {
    console.error("Error updating bank account balance:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * tags:
 *   name: Debts
 *   description: Operations related to debts.
 */

// Create a New Debt
/**
 * Creates a new debt.
 * @function
 * @name POST /debts
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - JSON response indicating success or failure.
 */
router.post("/debts", async (req, res) => {
  const {
    description,
    totalAmount,
    settledAmount,
    pendingAmount,
    status,
    type,
    debtor,
    debtorAccount,
    creditorAccount,
    creditor,
    isRecurring,
    recurrence,
  } = req.body;

  try {
    // Validate required fields
    if (
      !description ||
      !totalAmount ||
      !status ||
      !type ||
      !(debtor || debtorAccount) ||
      !(creditor || creditorAccount)
    ) {
      return res.status(400).json({ error: "Required fields are missing." });
    }

    // Create a new Debt
    const newDebt = new Debt({
      description,
      totalAmount,
      settledAmount,
      pendingAmount,
      status,
      type,
      debtor,
      debtorAccount,
      creditorAccount,
      creditor,
      isRecurring,
      recurrence,
    });

    // Save the debt to the database
    const savedDebt = await newDebt.save();

    res.status(201).json({
      message: "Debt created successfully",
      debt: savedDebt,
    });
  } catch (error) {
    console.error("Error creating debt:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get All Debts
/**
 * Retrieves all debts.
 * @function
 * @name GET /debts
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - JSON response containing the list of debts.
 */
router.get("/debts", async (req, res) => {
  try {
    const debts = await Debt.find();
    res.json(debts);
  } catch (error) {
    console.error("Error retrieving debts:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get a Specific Debt
/**
 * Retrieves a specific debt by its ID.
 * @function
 * @name GET /debts/:debtId
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - JSON response containing the details of the specified debt.
 */
router.get("/debts/:debtId", async (req, res) => {
  const { debtId } = req.params;

  try {
    const debt = await Debt.findById(debtId);
    if (!debt) {
      return res.status(404).json({ error: "Debt not found." });
    }

    res.json(debt);
  } catch (error) {
    console.error("Error retrieving debt:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update Debt Status
/**
 * Updates the status of a specific debt.
 * @function
 * @name PATCH /debts/:debtId/update-status
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - JSON response indicating success or failure.
 */
router.patch("/debts/:debtId/update-status", async (req, res) => {
  const { debtId } = req.params;
  const { newStatus } = req.body;

  try {
    // Validate required fields
    if (!newStatus || !["pending", "settled"].includes(newStatus)) {
      return res.status(400).json({ error: "Invalid status provided." });
    }

    // Find the debt by ID
    const debt = await Debt.findById(debtId);
    if (!debt) {
      return res.status(404).json({ error: "Debt not found." });
    }

    // Update the status of the debt
    debt.status = newStatus;
    await debt.save();

    res.json({
      message: "Debt status updated successfully",
      debt,
    });
  } catch (error) {
    console.error("Error updating debt status:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * tags:
 *   name: DebtTransactions
 *   description: Operations related to debt transactions.
 */

// Create a New Debt Transaction
/**
 * Creates a new debt transaction.
 * @function
 * @name POST /debts/:debtId/transactions
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - JSON response indicating success or failure.
 */
router.post("/debts/:debtId/transactions", async (req, res) => {
  const { debtId } = req.params;
  const { description, amount, category, date, type, sourceAccount } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate required fields
    if (!description || !amount || !type || !sourceAccount) {
      throw new Error("Required fields are missing.");
    }

    // Find the debt by ID
    const debt = await Debt.findById(debtId).session(session);
    if (!debt) {
      throw new Error("Debt not found.");
    }

    // Determine if the debt is positive or negative
    const isPositiveDebt = debt.type === "positive";

    // Create a new Debt Transaction
    const newDebtTransaction = new Transaction({
      description,
      amount,
      category,
      date,
      type,
      sourceAccount,
      debt: debtId,
    });

    // Save the debt transaction to the database within the transaction
    const savedDebtTransaction = await newDebtTransaction.save({ session });

    // Update the debtor's or creditor's account based on the type of debt
    const accountToUpdate = isPositiveDebt ? debt.debtor : debt.creditor;
    const account = await BankAccount.findById(accountToUpdate).session(
      session
    );

    if (!account) {
      throw new Error("Account not found.");
    }

    // Update the account balance
    account.balance += isPositiveDebt ? amount : -amount;
    await account.save();

    // Update the debt's total and pending amounts
    debt.totalAmount += amount;
    debt.pendingAmount += amount;
    await debt.save();

    // Commit the transaction
    await session.commitTransaction();

    res.status(201).json({
      message: "Debt transaction created successfully",
      debtTransaction: savedDebtTransaction,
    });
  } catch (error) {
    console.error("Error creating debt transaction:", error.message);

    // Rollback the transaction in case of an error
    await session.abortTransaction();
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // End the session
    session.endSession();
  }
});

module.exports = router;
