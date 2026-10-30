import { createContext, useState, useEffect} from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children}) => {
          const [ user, setUser] = useState(null);
          const [loading,setLoading] = useState(true);

           // func logout 
          const logout = async () => {
                    localStorage.removeItem('token');
                    setUser(null);
          };

          // get present profile
          const fetchUserProfile = async () => {
                    try {
                              const res= await api.get('/auth/me');
                              setUser(res.data);
                    } catch (error) {   
                              console.error('Session expired or invaild token',error);
                    } finally {
                              setLoading(false);
                    }
          };

          useEffect(() => {
                    // check token in localstorage ?
                    const token = localStorage.getItem('token');
                    if(token) {
                              fetchUserProfile();
                    } else {
                              setLoading(false);
                    };
          },[]);

          

          // func login 
          const login = async (email,password) => {
                    const res = await api.post('/auth/login',{email,password});
                    localStorage.setItem('token',res.data.token);
                    setUser(res.data);
                    return res.data;
          };

          // func register
          const register = async (name,email,password) => {
                    const res= await api.post('/auth/register',{name,email,password});
                    localStorage.setItem('token',res.data.token);
                    setUser(res.data);
                    return res.data;
          };


         

          return (
                    <AuthContext.Provider value={{user,login ,register,logout,loading}}>
                    {children}
                    </AuthContext.Provider>
          )
}