import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { failure, success } from '../utils/apiResponse.js';

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query('SELECT id, name, username, password_hash, role, is_active FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) return failure(res, 'Invalid username or password', 'INVALID_CREDENTIALS', 401);
    const token = jwt.sign({ id: user.id, name: user.name, username: user.username, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
    delete user.password_hash;
    return success(res, { user, token }, 'Login successful');
  } catch (error) { return next(error); }
}

export async function me(req, res) { return success(res, req.user, 'Authenticated user'); }
export async function logout(req, res) { return success(res, null, 'Logout acknowledged'); }
