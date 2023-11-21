// models.js

/**
 * Load environment variables from .env file.
 * @requires dotenv
 */
require("dotenv").config(); // Load environment variables from .env file

/**
 * Mongoose library for MongoDB interactions.
 * @external mongoose
 * @see {@link https://mongoosejs.com/}
 */
const mongoose = require("mongoose");

/**
 * Connect to MongoDB using the provided URI.
 * @function
 * @name connectToDatabase
 * @param {string} process.env.MONGODB_URI - The MongoDB URI.
 * @param {Object} options - Additional options for MongoDB connection.
 * @returns {Promise} - A promise that resolves when the connection is established.
 */
mongoose.connect(process.env.MONGODB_URI, {
  autoIndex: process.env.NODE_ENV !== "production", // Disable automatic index creation in production for improved performance
});

/**
 * Mongoose schema for the Transaction model.
 * @type {external:mongoose.Schema<TransactionSchema>}
 */
const transactionSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: String,
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["income", "expense", "self-transfer", "debt"],
    default: "expense",
  },
  sourceAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BankAccount",
  },
  destinationAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BankAccount",
  },
  debt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Debt",
  },
});

/**
 * Mongoose model for the Transaction schema.
 * @type {external:mongoose.Model<TransactionSchema>}
 */
const Transaction = mongoose.model("Transaction", transactionSchema);

/**
 * Mongoose schema for the BankAccount model.
 * @type {external:mongoose.Schema<BankAccountSchema>}
 */
const bankAccountSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
});

/**
 * Mongoose model for the BankAccount schema.
 * @type {external:mongoose.Model<BankAccountSchema>}
 */
const BankAccount = mongoose.model("BankAccount", bankAccountSchema);

/**
 * Mongoose schema for the Debt model.
 * @type {external:mongoose.Schema<DebtSchema>}
 */
const debtSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  settledAmount: {
    type: Number,
    required: true,
  },
  pendingAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "settled"],
    default: "pending",
  },
  type: {
    type: String,
    enum: ["negative", "positive"],
    default: "positive",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  debtor: {
    type: String, // Store debtor name as a String
  },
  debtorAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BankAccount",
  },
  creditorAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BankAccount",
  },
  creditor: {
    type: String, // Store creditor name as a String
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurrence: {
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
    },
    interval: {
      type: Number,
      default: 1, // Every 1 day/week/month/year
    },
    nextDueDate: Date,
  },
});

/**
 * Mongoose model for the Debt schema.
 * @type {external:mongoose.Model<DebtSchema>}
 */
const Debt = mongoose.model("Debt", debtSchema);

/**
 * Export the Transaction model and BankAccount model.
 * @exports Transaction
 * @exports BankAccount
 * @exports Debt
 */
module.exports = { Transaction, BankAccount, Debt };
