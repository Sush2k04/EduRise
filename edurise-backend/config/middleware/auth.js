import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  console.log('[Auth] Authorization header:', authHeader ? 'Present' : 'Missing');
  
  if (!token) {
    console.log('[Auth] No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    console.log('[Auth] Token verified for user:', req.user.id);
    next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    return res.status(401).json({ msg: 'Token is not valid', error: err.message });
  }
}

export default auth;