import React, { useState, useEffect, useContext } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  // Request loading
  const [request, setRequest] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // error
  const [error, setError] = useState({ show: false, msg: '' });

  const searchGithubUser = async user => {
    toggleError();
    setIsLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch(error => {
      console.log(error);
    });
    console.log(response);
    if (response) {
      setGithubUser(response.data);
      const { login, followers_url } = response.data;
      // // repose
      // axios(`${rootUrl}/users/${login}/repos?per_page=100`).then(response =>
      //   setRepos(response.data)
      // );
      // //followers
      // axios(`${followers_url}?per_page=100`).then(response =>
      //   setFollowers(response.data)
      // );

      // Get all the promise back in one time.
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`)
      ]).then((result) => {
        const [repos, followers] = result;
        const status = 'fulfilled';
        if (repos.status = status) {
          setRepos(repos.value.data);
        }
        if (followers.status = status) {
          setFollowers(followers.value.data);
        }
      }).catch((error) => {
        console.log(error);
      })
    } else {
      toggleError(true, 'There is no user with that username!');
    }
    checkRequests();
    setIsLoading(false);
  };

  // Check rate
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining }
        } = data;
        setRequest(remaining);
        if (remaining === 0) {
          // throw an error
          toggleError(true, 'sorry, you have exceeded your hourly rate limit!');
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  //error function
  function toggleError(show = false, msg = '') {
    setError({ show, msg });
  }

  useEffect(() => {
    checkRequests();
  }, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        request,
        error,
        searchGithubUser,
        isLoading
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export const useGlobalContext = () => {
  return useContext(GithubContext);
};

export { GithubProvider, GithubContext };
