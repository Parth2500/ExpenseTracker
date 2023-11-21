// server.js

/**
 * Load environment variables from .env file.
 * @requires dotenv
 */
require("dotenv").config();

/**
 * Express.js module for building web applications.
 * @external express
 * @see {@link https://expressjs.com/}
 */
const express = require("express");

/**
 * Body parsing middleware for handling JSON data.
 * @external bodyParser
 * @see {@link https://www.npmjs.com/package/body-parser}
 */
const bodyParser = require("body-parser");

/**
 * CORS middleware for handling Cross-Origin Resource Sharing.
 * @external cors
 * @see {@link https://www.npmjs.com/package/cors}
 */
const cors = require("cors");

/**
 * Swagger UI middleware for serving OpenAPI documentation.
 * @external swaggerUi
 * @see {@link https://www.npmjs.com/package/swagger-ui-express}
 */
const swaggerUi = require("swagger-ui-express");

/**
 * OpenAPI specification generator for Express routes.
 * @external swaggerJsdoc
 * @see {@link https://www.npmjs.com/package/swagger-jsdoc}
 */
const swaggerJsdoc = require("swagger-jsdoc");

/**
 * Routes module defining the API routes.
 * @type {module:routes}
 * @see {@link module:routes}
 */
const routes = require("./routes");

/**
 * Express application instance.
 * @type {external:express.Application}
 */
const app = express();

/**
 * The port on which the server will listen.
 * @type {number}
 * @default 3000
 */
const PORT = process.env.PORT || 3000;

/**
 * CORS options specifying the allowed origins.
 * @type {Object}
 */
const corsOptions = {
  origin: [process.env.ALLOWED_ORIGIN || "http://localhost:3000"], // Add your allowed origins here
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

// Middleware to enable CORS
app.use(cors(corsOptions));

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Routes for API endpoints
app.use("/api", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Define OpenAPI options
const swaggerOptions = require("../swaggerOptions");

// Generate OpenAPI specification based on JSDoc comments
const openApiSpecification = swaggerJsdoc(swaggerOptions);

// Serve OpenAPI documentation using Swagger UI
app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(openApiSpecification));

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
