import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { FaSearch, FaSort, FaExternalLinkAlt, FaFilter, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import Loader from '../Loader';
import '../../styles/SimpleProject/CurrentSubmissions.css';

const CurrentSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [venues, setVenues] = useState([]);
  const [editingVenue, setEditingVenue] = useState(null);
  const [editVenueValue, setEditVenueValue] = useState('');
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false);
  const [filteredVenueSuggestions, setFilteredVenueSuggestions] = useState([]);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    project: '',
    venue: ''
  });

  const { user } = useSelector((state) => state.user);
  
  // Permission check function for venue editing
  const canEditSubmissionVenue = (submission) => {
    if (!submission || !user) return false;
    
    // For PhD students, check if they are lead author or in team
    if (user.role === 'phd') {
      const isLeadAuthor = submission.lead_author && 
                          (submission.lead_author._id === user.id || submission.lead_author === user.id);
      const isInTeam = submission.team && 
                      submission.team.some(member => 
                        member._id === user.id || member === user.id
                      );
      return isLeadAuthor || isInTeam;
    }
    
    // Faculty can edit their own projects
    if (user.role === 'faculty') {
      return submission.faculty_id === user.id || 
             (submission.faculty_id && submission.faculty_id._id === user.id);
    }
    
    return false;
  };

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        let response = null;
        if(user.role === 'faculty') response = await axios.get(`/api/v1/projects/${user?.id}`);
        else response = await axios.get(`/api/v1/projects/student/${user?.id}`);
        // Filter to only include projects with status "under-review"
        
        const underReviewProjects = response.data.filter(
          project => project.status === 'under-review'
        );
        
        setSubmissions(underReviewProjects);
        setFilteredSubmissions(underReviewProjects);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch submission data');
      } finally {
        setLoading(false);
      }
    };

    if(user) fetchSubmissions();
  }, []);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await axios.get(`/api/v1/venues/${user.id}`);
        // Extract venue names from the venues array
        const venueNames = response.data.venues.map(venue => venue.venue);
        setVenues(venueNames);
      } catch (err) {
        console.error('Error fetching venues:', err);
      }
    };

    if (user && user.id) fetchVenues();
  }, [user]);

  useEffect(() => {
    let results = submissions;

    // Apply search term filter
    if (searchTerm) {
      results = results.filter(submission =>
        submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.lead_author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.venue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply individual filters
    if (filters.name) {
      results = results.filter(submission =>
        submission.lead_author.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.project) {
      results = results.filter(submission =>
        submission.name.toLowerCase().includes(filters.project.toLowerCase())
      );
    }
    if (filters.venue) {
      results = results.filter(submission =>
        submission.venue.toLowerCase().includes(filters.venue.toLowerCase())
      );
    }

    setFilteredSubmissions(results);
  }, [searchTerm, filters, submissions]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedData = [...filteredSubmissions].sort((a, b) => {
      // Handle nested objects and null values
      const valueA = key.includes('.') ? 
        key.split('.').reduce((o, i) => o && o[i], a) : a[key];
      const valueB = key.includes('.') ? 
        key.split('.').reduce((o, i) => o && o[i], b) : b[key];

      if (valueA == null) return direction === 'asc' ? 1 : -1;
      if (valueB == null) return direction === 'asc' ? -1 : 1;
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredSubmissions(sortedData);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditVenue = (submissionId, currentVenue) => {
    const submission = submissions.find(sub => sub._id === submissionId);
    if (!canEditSubmissionVenue(submission)) {
      alert('Permission denied. PhD students can only edit venue for projects where they are lead author or team member.');
      return;
    }
    setEditingVenue(submissionId);
    setEditVenueValue(currentVenue);
  };

  const handleVenueSelectChange = (e) => {
    setEditVenueValue(e.target.value);
  };

  const handleSaveVenue = async (submissionId) => {
    try {
      await axios.put(`/api/v1/projects/${submissionId}`, {
        venue: editVenueValue
      });
      
      // Update local state
      setSubmissions(prev => prev.map(sub => 
        sub._id === submissionId ? { ...sub, venue: editVenueValue } : sub
      ));
      setFilteredSubmissions(prev => prev.map(sub => 
        sub._id === submissionId ? { ...sub, venue: editVenueValue } : sub
      ));
      
      setEditingVenue(null);
      setEditVenueValue('');
      setShowVenueSuggestions(false);
    } catch (err) {
      console.error('Error updating venue:', err);
      alert('Failed to update venue');
    }
  };

  const handleCancelEdit = () => {
    setEditingVenue(null);
    setEditVenueValue('');
    setShowVenueSuggestions(false);
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      project: '',
      venue: ''
    });
    setSearchTerm('');
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="submissions-error">
        {error}
      </div>
    );
  }

  return (
    <div className="submissions-container">
      <div className="submissions-header">
        <h2>Current Submissions</h2>
        <div className="submissions-controls">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className={`filter-btn ${filterOpen ? 'active' : ''}`}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <FaFilter /> Filters
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Author Name</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Filter by author..."
            />
          </div>
          <div className="filter-group">
            <label>Project Name</label>
            <input
              type="text"
              name="project"
              value={filters.project}
              onChange={handleFilterChange}
              placeholder="Filter by project..."
            />
          </div>
          <div className="filter-group">
            <label>Venue</label>
            <input
              type="text"
              name="venue"
              value={filters.venue}
              onChange={handleFilterChange}
              placeholder="Filter by venue..."
            />
          </div>
          <button className="reset-filters" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      )}

      {filteredSubmissions.length === 0 ? (
        <div className="no-submissions">
          No submissions found 
        </div>
      ) : (
        <div className="submissions-table-container">
          <table className="submissions-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('lead_author.name')}>
                  Lead Author <FaSort className="sort-icon" />
                </th>
                <th onClick={() => handleSort('name')}>
                  Project Name <FaSort className="sort-icon" />
                </th>
                <th onClick={() => handleSort('venue')}>
                  Venue <FaSort className="sort-icon" />
                </th>
                <th onClick={() => handleSort('date_of_submission')}>
                  Last Submitted On <FaSort className="sort-icon" />
                </th>
                <th onClick={() => handleSort('next_deadline')}>
                  Next Deadline <FaSort className="sort-icon" />
                </th>
                <th>Paper URL</th>
                <th>Submission URL</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((submission) => (
                <tr key={submission._id}>
                  <td>{submission.lead_author?.name || 'N/A'}</td>
                  <td>{submission.name}</td>
                  <td>
                    {editingVenue === submission._id ? (
                      <div className="venue-edit-container">
                        <select
                          value={editVenueValue}
                          onChange={handleVenueSelectChange}
                          autoFocus
                          className="venue-edit-select"
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            marginBottom: '4px'
                          }}
                        >
                          <option value="">Select a venue...</option>
                          {venues.map((venue, index) => (
                            <option key={index} value={venue}>
                              {venue}
                            </option>
                          ))}
                        </select>
                        <div className="venue-edit-actions">
                          <button
                            onClick={() => handleSaveVenue(submission._id)}
                            className="venue-save-btn"
                            style={{
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              padding: '2px 8px',
                              borderRadius: '3px',
                              marginRight: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            <FaSave />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="venue-cancel-btn"
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '2px 8px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="venue-display" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{submission.venue}</span>
                        {canEditSubmissionVenue(submission) && (
                          <button
                            onClick={() => handleEditVenue(submission._id, submission.venue)}
                            className="venue-edit-btn"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#007bff',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              fontSize: '12px'
                            }}
                            title="Edit venue"
                          >
                            <FaEdit />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td>{formatDate(submission.date_of_submission)}</td>
                  <td>
                    {formatDate(submission.next_deadline)}
                    {submission.remarks && (
                      <span className="remarks-tooltip" data-tooltip={submission.remarks}>
                        *
                      </span>
                    )}
                  </td>
                  <td>
                    {submission.paper_url ? (
                      <a 
                        href={submission.paper_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="url-link"
                      >
                        <FaExternalLinkAlt />
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    {submission.submission_url ? (
                      <a 
                        href={submission.submission_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="url-link"
                      >
                        <FaExternalLinkAlt />
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CurrentSubmissions;