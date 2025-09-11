
// Very light auth using localStorage (demo only)
const KEY = "core_auth_v1";

export function getAuth(){
  try { return JSON.parse(localStorage.getItem(KEY)) || { user:null }; }
  catch { return { user:null }; }
}
export function setAuth(data){
  localStorage.setItem(KEY, JSON.stringify(data||{user:null}));
}
export function login(username){
  // roles by convention: manager user 'manager'; others treated as capo
  const role = username.toLowerCase()==="manager" ? "manager" : "capo";
  const user = { name: username, role };
  setAuth({ user });
  return user;
}
export function logout(){
  setAuth({ user:null });
}
export function requireRole(){
  const { user } = getAuth();
  return user?.role || null;
}
