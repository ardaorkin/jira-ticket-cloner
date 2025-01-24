# Clone Jira Ticket

This project allows you to clone a Jira ticket from one project to another, optionally linking it to an epic and assigning it to a component.

## Prerequisites

- Node.js
- npm
- A Jira account with API access

## Setup

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd clone-jira
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add the following environment variables:
    ```env
    JIRA_API_KEY=your_jira_api_key
    JIRA_EMAIL=your_jira_email
    JIRA_DOMAIN=your_jira_domain
    ```

## Usage

Run the script with the following command:
```sh
npm start <sourceTicketId> <targetProjectKey> [epicKey] [componentName]
```

### Examples

Clone a ticket:
```sh
npm start ABC-123 XYZ
```

Clone a ticket and link it to an epic:
```sh
npm start ABC-123 XYZ XYZ-456
```

Clone a ticket, link it to an epic, and assign it to a component:
```sh
npm start ABC-123 XYZ XYZ-456 'Frontend'
```

## Error Handling

The script will validate the provided epic and component names, and will output detailed error messages if any issues are encountered.

## License

This project is licensed under the MIT License.
