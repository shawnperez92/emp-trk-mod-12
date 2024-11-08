import inquirer from 'inquirer';
import db from './db/connection.js';
import cTable from 'console.table';

console.log('Welcome to the Employee Tracker!');

// Main Menu
async function mainMenu() {
  try {
    const answers = await inquirer.prompt({
      type: 'list',
      name: 'options',
      message: 'What would you like to do?',
      choices: [
        { name: 'View All Employee', value: 'VIEW_ALL_EMPLOYEE' },
        { name: 'Add Employee', value: 'ADD_EMPLOYEE' },
        { name: 'Update Employee Role', value: 'UPDATE_EMPLOYEE_ROLE' },
        { name: 'View All Roles', value: 'VIEW_ALL_ROLES' },
        { name: 'Add Role', value: 'ADD_ROLE' },
        { name: 'View All Departments', value: 'VIEW_ALL_DEPARTMENTS' },
        { name: 'Add Department', value: 'ADD_DEPARTMENT' },
        { name: 'Quit', value: 'QUIT' },
      ],
    });

    switch (answers.options) {
      case 'VIEW_ALL_DEPARTMENTS':
        await viewDepartments();
        break;
      case 'VIEW_ALL_ROLES':
        await viewRoles();
        break;
      case 'VIEW_ALL_EMPLOYEE':
        await viewEmployees();
        break;
      case 'ADD_DEPARTMENT':
        await addDepartment();
        break;
      case 'ADD_ROLE':
        await addRole();
        break;
      case 'ADD_EMPLOYEE':
        await addEmployee();
        break;
      case 'UPDATE_EMPLOYEE_ROLE':
        await updateEmployeeRole();
        break;
      case 'QUIT':
        await db.end();
        console.log('Goodbye!');
        break;
    }
  } catch (err) {
    console.error(err.stack);
  }
}

// View Departments
async function viewDepartments() {
  try {
    const res = await db.query('SELECT * FROM departments');
    console.table(res.rows);
    await mainMenu();
  } catch (err) {
    console.error(err.stack);
  }
}

// View Roles
async function viewRoles() {
  const query = `
    SELECT roles.id, roles.title, departments.name AS department, roles.salary
    FROM roles
    LEFT JOIN departments ON roles.department_id = departments.id`;

  try {
    const res = await db.query(query);
    console.table(res.rows);
    await mainMenu();
  } catch (err) {
    console.error(err.stack);
  }
}

// View Employees
async function viewEmployees() {
  const query = `
    SELECT employees.id, employees.first_name, employees.last_name, roles.title, 
           departments.name AS department, roles.salary, 
           CONCAT(manager.first_name, ' ', manager.last_name) AS manager
    FROM employees
    LEFT JOIN roles ON employees.role_id = roles.id
    LEFT JOIN departments ON roles.department_id = departments.id
    LEFT JOIN employees manager ON employees.manager_id = manager.id`;

  try {
    const res = await db.query(query);
    console.table(res.rows);
    await mainMenu();
  } catch (err) {
    console.error(err.stack);
  }
}

// Add a Department
async function addDepartment() {
  try {
    const answer = await inquirer.prompt({
      type: 'input',
      name: 'name',
      message: 'Enter the name of the department:',
    });
    const res = await db.query('INSERT INTO departments (name) VALUES ($1) RETURNING *', [answer.name]);
    console.log(`Department added: ${res.rows[0].name}`);
    await mainMenu();
  } catch (err) {
    console.error(err.stack);
  }
}

// Add a Role
async function addRole() {
  try {
    const res = await db.query('SELECT * FROM departments');
    const departments = res.rows;
    const answer = await inquirer.prompt([
      { type: 'input', name: 'title', message: 'Enter the title of the role:' },
      { type: 'input', name: 'salary', message: 'Enter the salary for the role:' },
      {
        type: 'list',
        name: 'department_id',
        message: 'Select the department for the role:',
        choices: departments.map(department => ({ name: department.name, value: department.id })),
      },
    ]);
    const res2 = await db.query(
      'INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3) RETURNING *',
      [answer.title, answer.salary, answer.department_id]
    );
    console.log(`Role added: ${res2.rows[0].title}`);
    await mainMenu();
  } catch (err) {
    console.error(err.stack);
  }
}

// Add an Employee
async function addEmployee() {
  try {
    const res = await db.query('SELECT * FROM roles');
    const roles = res.rows;
    const res2 = await db.query('SELECT * FROM employees');
    const employees = res2.rows;
    const answer = await inquirer.prompt([
      { type: 'input', name: 'first_name', message: "Enter the employee's first name:" },
      { type: 'input', name: 'last_name', message: "Enter the employee's last name:" },
      {
        type: 'list',
        name: 'role_id',
        message: "Select the employee's role:",
        choices: roles.map(role => ({ name: role.title, value: role.id })),
      },
      {
        type: 'list',
        name: 'manager_id',
        message: "Select the employee's manager:",
        choices: employees.map(employee => ({ name: `${employee.first_name} ${employee.last_name}`, value: employee.id })).concat({ name: 'None', value: null }),
      },
    ]);
    const res3 = await db.query(
      'INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [answer.first_name, answer.last_name, answer.role_id, answer.manager_id]
    );
    console.log(`Employee added: ${res3.rows[0].first_name} ${res3.rows[0].last_name}`);
    await mainMenu();
  } catch (err) {
    console.error(err.stack);
  }
}

// Update Employee Role
async function updateEmployeeRole() {
  try {
    const res = await db.query('SELECT * FROM employees');
    const employees = res.rows;
    const res2 = await db.query('SELECT * FROM roles');
    const roles = res2.rows;
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'id',
        message: 'Select the employee to update:',
        choices: employees.map(employee => ({ name: `${employee.first_name} ${employee.last_name}`, value: employee.id })),
      },
      {
        type: 'list',
        name: 'role_id',
        message: 'Select the new role:',
        choices: roles.map(role => ({ name: role.title, value: role.id })),
      },
    ]);
    const res3 = await db.query(
      'UPDATE employees SET role_id = $1 WHERE id = $2 RETURNING *',
      [answer.role_id, answer.id]
    );
    console.log(`Updated role for employee ID ${answer.id}`);
    await mainMenu();
  } catch (err) {
    console.error(err.stack);
  }
}

// Start Application
mainMenu();