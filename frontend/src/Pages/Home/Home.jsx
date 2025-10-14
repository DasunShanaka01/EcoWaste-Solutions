import React, { useEffect, useMemo, useState } from 'react'
import { useUser } from '../Users/UserContext'
import api from '../../api/auth'

const Home = () => {
  const { user, setUser } = useUser();
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    // Ensure we have a full user object (with id) in context
    const ensureUser = async () => {
      if (!user || (!user.id && !user._id)) {
        try {
          const current = await api.getCurrentUser();
          const normalized = current?.user || current; // some APIs wrap inside { user }
          if (normalized) {
            setUser(normalized);
          } else {
            setLoadFailed(true);
          }
        } catch (e) {
          setLoadFailed(true);
        }
      }
    };
    ensureUser();
  }, [user, setUser]);

  const userId = useMemo(() => {
    if (!user) return undefined;
    return user.id || user._id;
  }, [user]);

  return (
    <div>
      Home<br />
      {userId && (<span>User ID: {userId}</span>)}
      {!userId && !loadFailed && (<span>Loading user...</span>)}
      {!userId && loadFailed && (
        <span>Could not load user</span>
      )}
      {!userId && user && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(user, null, 2)}</pre>
      )}
    </div>
  )
}

export default Home