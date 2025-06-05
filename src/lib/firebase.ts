import { login, register, getUserById } from './auth';
import { getTasks, saveTasks } from './local-db';

export const auth = { login, register, getUserById };
export const db = { getTasks, saveTasks };

export default {};
