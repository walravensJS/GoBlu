import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useUsers } from "../../services/users/"; // Assuming this hook provides { users (all), loading, error, searchUsers }
import { useFriends } from "../../services/friends/"; // Assuming this hook provides { friends, loading, error }
// Placeholder for your actual function to add a friend
// import { addFriendFunction } from "../../services/friendService";

export default function Friends() {
  const {
    friends,
    loading: friendsLoading,
    error: friendsError,
  } = useFriends();
  const {
    // Note: useUsers usually returns all users in a property like `users` or `allUsers`
    // The searchUsers function from this hook will operate on that internal list.
    loading: usersLoading,
    error: usersError,
    searchUsers, // This function should come from your useUsers hook
  } = useUsers();

  const [searchTerm, setSearchTerm] = useState("");
  const isSearching = !!searchTerm.trim();

  // Memoize the set of friend IDs for efficient lookup (O(1) average time complexity)
  const friendIds = useMemo(() => new Set(friends.map(f => f.id)), [friends]);

  // Determine which users to display based on search state
  const displayItems = useMemo(() => {
    if (isSearching) {
      // When searching, use the searchUsers function which filters all users
      // searchUsers should ideally be memoized by useUsers or stable
      return searchUsers ? searchUsers(searchTerm) : [];
    }
    // When not searching, display the current list of friends
    return friends;
  }, [isSearching, searchTerm, searchUsers, friends]);

  const currentLoading = isSearching ? usersLoading : friendsLoading;
  const currentError = isSearching ? usersError : friendsError;

  // Placeholder function for adding a friend
  const handleAddFriend = async (userIdToAdd) => {
    console.log("Attempting to add friend:", userIdToAdd);
    // Replace with your actual Firebase logic:
    // try {
    //   await addFriendFunction(loggedInUserId, userIdToAdd);
    //   alert("Friend added successfully!");
    //   // Optionally, refetch friends or update UI optimistically
    // } catch (err) {
    //   console.error("Failed to add friend:", err);
    //   alert(`Failed to add friend: ${err.message}`);
    // }
    alert(
      `Placeholder: Implement logic to add friend with ID ${userIdToAdd}.`
    );
  };

  if (currentLoading) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentError) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto text-red-500">
          <p>Error: {currentError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Friends</h1>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isSearching
                  ? "Search all users (name, email, ID)..."
                  : "Search your friends..."
              }
              className="w-full p-3 pl-10 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            />
            <svg
              className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {displayItems.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-2">
              {isSearching
                ? "No users match your search."
                : "You don't have any friends yet. Try searching for people to add!"}
            </p>
            {/* Optional: Button to guide users if they have no friends and are not searching */}
            {!isSearching && friends.length === 0 && (
              <button
                onClick={() => {
                  // Example: focus the input or set a default search term to guide user
                  const input = document.querySelector('input[type="text"]');
                  if (input) input.focus();
                }}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Find People
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayItems.map((user) => {
              const isAlreadyFriend = friendIds.has(user.id);
              // Show active status only for users who are friends (i.e., when not in global search mode)
              // and if the 'isActive' property exists on the friend object.
              const showActiveStatus = !isSearching && user.isActive !== undefined;

              return (
                <div
                  key={user.id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between border border-gray-100"
                >
                  <Link
                    to={`/users/${user.id}`} // Links to user's profile page
                    className="flex items-center flex-grow mb-2 sm:mb-0 sm:mr-2 w-full"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
                        {user.displayName?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="ml-4 flex-grow min-w-0"> {/* Added min-w-0 for text truncation if needed */}
                      <div className="flex items-center">
                        <h3 className="font-medium truncate"> {/* Added truncate for long names */}
                          {user.displayName || "Anonymous User"}
                        </h3>
                        {showActiveStatus && (
                          <div
                            className={`w-2.5 h-2.5 rounded-full ml-2 flex-shrink-0 ${
                              user.isActive ? "bg-green-500" : "bg-gray-400"
                            }`}
                          ></div>
                        )}
                      </div>
                      {/* Optionally display email when searching all users */}
                      {isSearching && user.email && (
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      )}
                    </div>
                  </Link>

                  {/* Interaction buttons */}
                  {isSearching && !isAlreadyFriend && (
                    <button
                      onClick={() => handleAddFriend(user.id)}
                      className="mt-2 sm:mt-0 px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm self-start sm:self-center whitespace-nowrap flex-shrink-0"
                    >
                      Add Friend
                    </button>
                  )}
                  {isSearching && isAlreadyFriend && (
                    <span className="mt-2 sm:mt-0 px-3 py-1.5 text-xs text-gray-500 self-start sm:self-center whitespace-nowrap flex-shrink-0">
                      Friends
                    </span>
                  )}
                  {/* If not searching, it's a friend, so no button needed here (could be "View Profile" if link wasn't whole card) */}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}