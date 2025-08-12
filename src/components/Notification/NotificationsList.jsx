import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  FiBell, 
  FiTrash2, 
  FiClock, 
  FiAlertTriangle,
  FiFlag,
  FiAlertCircle,
  FiInfo,
  FiFilter,
  FiSearch,
  FiChevronDown
} from "react-icons/fi";
import { FaEdit, FaCircle } from "react-icons/fa";
import Loader from "../Loader";
import "../../styles/Notification/NotificationsList.css";

const NotificationsList = () => {
  const { user } = useSelector((state) => state.user);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { currentTheme } = useSelector((state) => state.theme);
  
  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    addedBy: '',
    dueDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/v1/notifications/${user.id}`);
        if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        const notificationsData = data.notification || [];

        const updatedNotifications = notificationsData.map((notif) => {
          const addedByName = notif.added_by && typeof notif.added_by === "object"
            ? notif.added_by._id === user.id ? "You" : notif.added_by.name || "Unknown"
            : "System";
          
          return { 
            ...notif, 
            added_by_name: addedByName
          };
        });

        // Sort by due date by default (earliest first, null dates last)
        const sortedNotifications = updatedNotifications.sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        });

        setNotifications(sortedNotifications);
        setFilteredNotifications(sortedNotifications);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...notifications];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(notif => 
        notif.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.added_by_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(notif => notif.type === filters.type);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(notif => notif.priority === filters.priority);
    }

    // Added by filter
    if (filters.addedBy) {
      filtered = filtered.filter(notif => 
        notif.added_by_name?.toLowerCase().includes(filters.addedBy.toLowerCase())
      );
    }

    // Due date filter
    if (filters.dueDate) {
      const now = new Date();
      const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      const twentyDaysFromNow = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(notif => {
        if (!notif.due_date) return false;
        const dueDate = new Date(notif.due_date);
        
        switch (filters.dueDate) {
          case 'next10days':
            return dueDate >= now && dueDate <= tenDaysFromNow;
          case 'next20days':
            return dueDate >= now && dueDate <= twentyDaysFromNow;
          case 'expired':
            return dueDate < now;
          default:
            return true;
        }
      });
    }

    setFilteredNotifications(filtered);
  }, [notifications, filters, searchTerm]);

  const isExpired = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const deleteNotification = async (id, added_by) => {
    if (!id) return;

    if ((added_by && typeof added_by === "object" && added_by._id !== user?.id) || 
        (typeof added_by === "string" && added_by !== user?.id)) {
      alert("You can only delete your own notifications");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this notification?");
    if (!confirmDelete) return;

    try {
      setLoading(true);
      
      const response = await fetch(`/api/v1/notifications/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete notification");
      
      setNotifications(prev => prev.filter(notif => notif._id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
      setError("Failed to delete notification");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityCircle = (priority) => {
    const priorityColors = {
      high: '#dc3545',    // Red
      medium: '#ffc107',  // Orange/Yellow
      low: '#28a745'      // Green
    };
    
    const color = priorityColors[priority?.toLowerCase()] || '#6c757d';
    
    return (
      <FaCircle 
        style={{ 
          color: color, 
          fontSize: '8px', 
          marginRight: '8px' 
        }} 
      />
    );
  };

  const getTypeIcon = (type) => {
    const types = {
      todo: "Task",
      reminder: "Reminder", 
      deadline: "Deadline",
      announcement: "Announcement",
      default: "Message"
    };
    
    return types[type?.toLowerCase()] || types.default;
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      priority: '',
      addedBy: '',
      dueDate: ''
    });
    setSearchTerm('');
  };

  const getUniqueAddedByNames = () => {
    const names = [...new Set(notifications.map(n => n.added_by_name))];
    return names.filter(name => name && name !== '');
  };

  if (loading) return <Loader />;

  return (
    <div className={`notifications-container ${currentTheme}`}>
      <div className="notifications-header">
        <div className="notifications-title">
          <FiBell className="notifications-icon" />
          <h1>Notifications</h1>
          <span className="notifications-count">{filteredNotifications.length}</span>
        </div>
        
        <div className="notifications-controls">
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter /> Filters
          </button>
          
          <button 
            className="add-notification-btn"
            onClick={() => navigate("/manage-notification")}
          >
            <FaEdit /> Add New
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="notifications-search">
        <div className="search-input-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Type:</label>
              <select 
                value={filters.type} 
                onChange={(e) => setFilters({...filters, type: e.target.value})}
              >
                <option value="">All Types</option>
                <option value="reminder">Reminder</option>
                <option value="todo">Task</option>
                <option value="deadline">Deadline</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Priority:</label>
              <select 
                value={filters.priority} 
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Added by:</label>
              <select 
                value={filters.addedBy} 
                onChange={(e) => setFilters({...filters, addedBy: e.target.value})}
              >
                <option value="">All Users</option>
                {getUniqueAddedByNames().map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Due Date:</label>
              <select 
                value={filters.dueDate} 
                onChange={(e) => setFilters({...filters, dueDate: e.target.value})}
              >
                <option value="">All Dates</option>
                <option value="next10days">Next 10 Days</option>
                <option value="next20days">Next 20 Days</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear All Filters
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="error-message">
          <FiAlertTriangle /> {error}
        </div>
      )}

      {/* Notifications Table */}
      <div className="notifications-table-container">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <FiBell className="empty-icon" />
            <h3>No notifications found</h3>
            <p>Create your first notification or adjust your filters</p>
            <button 
              className="add-notification-btn"
              onClick={() => navigate("/manage-notification")}
            >
              Add Notification
            </button>
          </div>
        ) : (
          <table className="notifications-table">
            <thead>
              <tr>
                <th>Type</th>
                <th className="message-column">Message</th>
                <th>Due Date</th>
                <th>Added By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.map((notif) => {
                const expired = isExpired(notif.due_date);
                
                return (
                  <tr 
                    key={notif._id}
                    className={`notification-row ${expired ? 'expired' : ''}`}
                  >
                    <td className="type-column">
                      <div className="type-cell">
                        {getPriorityCircle(notif.priority)}
                        <span>{getTypeIcon(notif.type)}</span>
                      </div>
                    </td>
                    <td className="message-column">
                      <div className="message-cell">
                        {notif.text || "No message"}
                      </div>
                    </td>
                    <td className="date-column">
                      <div className={`date-cell ${expired ? 'expired' : ''}`}>
                        <FiClock className="date-icon" />
                        <span>
                          {notif.due_date ? 
                            new Date(notif.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : 
                            'No due date'
                          }
                        </span>
                        {expired && <span className="expired-label">EXPIRED</span>}
                      </div>
                    </td>
                    <td className="added-by-column">
                      <span className="added-by-cell">
                        {notif.added_by_name}
                      </span>
                    </td>
                    <td className="actions-column">
                      <button
                        className="delete-btn"
                        onClick={() => deleteNotification(notif._id, notif.added_by)}
                        disabled={loading}
                        title="Delete notification"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default NotificationsList;