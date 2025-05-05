import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "WhatsApp API",
      version: "1.0.0",
      description: "API to interact with WhatsApp session",
    },
  },
 
  apis: [path.join(__dirname, "../**/*.ts")], 
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };
