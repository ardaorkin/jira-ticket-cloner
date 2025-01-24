import "dotenv/config";
import axios from "axios";

// Validate environment variables
const requiredEnvVars = ["JIRA_API_KEY", "JIRA_EMAIL", "JIRA_DOMAIN"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in environment variables`);
    process.exit(1);
  }
}

// Validate command line arguments
if (process.argv.length < 4 || process.argv.length > 6) {
console.error("Usage: npm start <sourceTicketId> <targetProjectKey> [epicKey] [componentName]");
console.error("Example: npm start ABC-123 XYZ");
console.error("Example with epic: npm start ABC-123 XYZ XYZ-456");
console.error("Example with epic and component: npm start ABC-123 XYZ XYZ-456 'Frontend'");
process.exit(1);
}

const [sourceTicketId, targetProjectKey, epicKey, componentName] = process.argv.slice(2);
const baseUrl = `https://${process.env.JIRA_DOMAIN}`;
const auth = Buffer.from(
  `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_KEY}`
).toString("base64");

const api = axios.create({
  baseURL: baseUrl,
  headers: {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  },
});

async function getSourceTicket(ticketId) {
  try {
    const response = await api.get(`/rest/api/2/issue/${ticketId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch source ticket: ${error.message}`);
  }
}

async function createClonedTicket(sourceTicket, targetProjectKey, epicKey, componentName) {
const payload = {
    fields: {
    project: { key: targetProjectKey },
    summary: sourceTicket.fields.summary,
    description: sourceTicket.fields.description,
    issuetype: {
        id: sourceTicket.fields.issuetype.id,
    },
    priority: sourceTicket.fields.priority,
    labels: sourceTicket.fields.labels,
    },
};

if (epicKey) {
    payload.fields.customfield_10014 = epicKey;
}

if (componentName) {
    payload.fields.components = [{ name: componentName }];
}

  try {
    const response = await api.post("/rest/api/2/issue", payload);
    return response.data;
} catch (error) {
if (error.response && error.response.data) {
    console.error('Error Response Data:');
    console.error('Status:', error.response.status);
    console.error('Error Messages:', error.response.data.errorMessages);
    console.error('Validation Errors:', JSON.stringify(error.response.data.errors, null, 2));
} else {
    console.error('Error:', error);
}
throw new Error(`Failed to create cloned ticket: ${error.message}`);
}
}

async function validateEpic(epicKey, projectKey) {
try {
    const response = await api.get(`/rest/api/2/issue/${epicKey}`);
    const epic = response.data;
    
    // Verify it's an epic
    if (epic.fields.issuetype.name.toLowerCase() !== 'epic') {
    throw new Error(`${epicKey} is not an epic`);
    }
    
    // Verify it belongs to the target project
    if (epic.fields.project.key !== projectKey) {
    throw new Error(`Epic ${epicKey} does not belong to project ${projectKey}`);
    }
    
    return true;
} catch (error) {
    if (error.response && error.response.status === 404) {
    throw new Error(`Epic ${epicKey} not found`);
    }
    throw new Error(`Failed to validate epic: ${error.message}`);
}
}

async function validateComponent(componentName, projectKey) {
try {
    const response = await api.get(`/rest/api/2/project/${projectKey}/components`);
    const components = response.data;
    
    const componentExists = components.some(
    component => component.name === componentName
    );
    
    if (!componentExists) {
    throw new Error(`Component '${componentName}' not found in project ${projectKey}`);
    }
    
    return true;
} catch (error) {
    if (error.response && error.response.status === 404) {
    throw new Error(`Project ${projectKey} not found`);
    }
    throw error.response ? error : new Error(`Failed to validate component: ${error.message}`);
}
}

async function main() {
  console.log(`\nStarting ticket clone process...`);
console.log(`Source Ticket: ${sourceTicketId}`);
console.log(`Target Project: ${targetProjectKey}`);
if (epicKey) console.log(`Target Epic: ${epicKey}`);
if (componentName) console.log(`Target Component: ${componentName}`);
console.log();

  try {
    console.log("Fetching source ticket details...");
    const sourceTicket = await getSourceTicket(sourceTicketId);

    if (epicKey) {
    console.log("Validating epic...");
    await validateEpic(epicKey, targetProjectKey);
    }

    if (componentName) {
    console.log("Validating component...");
    await validateComponent(componentName, targetProjectKey);
    }

    console.log("Creating cloned ticket...");
    const newTicket = await createClonedTicket(sourceTicket, targetProjectKey, epicKey, componentName);

    console.log("\nSuccess! Ticket cloned successfully:");
    console.log(`New Ticket Key: ${newTicket.key}`);
    console.log(`Ticket URL: ${baseUrl}/browse/${newTicket.key}`);
  } catch (error) {
    console.error("\nError:", error.message);
    process.exit(1);
  }
}

main();
