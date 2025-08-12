import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faSave, faTrashAlt, faPlus, faSearch, 
  faUser, faCalendarAlt, faMapMarkerAlt, faClock, faLink,
  faEdit, faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/Venues/VenueAddForm.css';

const VenueAddForm = () => {
    const { user } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const [venues, setVenues] = useState([]);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [venueSearch, setVenueSearch] = useState("");
    const [teamSearch, setTeamSearch] = useState("");
    const [allVenues, setAllVenues] = useState([]);
    const [showVenueSuggestions, setShowVenueSuggestions] = useState(false);
    const [filteredVenueSuggestions, setFilteredVenueSuggestions] = useState([]);
    const [showAllVenues, setShowAllVenues] = useState(false);
    
    const today = new Date().toISOString().split("T")[0];
    
    // Permission check function
    const canEditVenue = (venue) => {
        if (!venue || !user) return false;
        
        // User is the owner (added_by)
        const isOwner = venue.added_by === user.id || 
                       (venue.added_by?._id && venue.added_by._id === user.id);
        
        // PhD student is in the view list
        const isInViewList = user.role === 'phd' && 
                            venue.view && 
                            venue.view.includes(user.id);
        
        return isOwner || isInViewList;
    };

    const convertToIST = (dateStr, timezone) => {
        if (!dateStr) return null;
        
        try {
            const date = new Date(dateStr);
            
            if (timezone) {
                // Parse timezone offset (e.g., "UTC+5:30", "UTC-12:00")
                const match = timezone.match(/UTC([+-])(\d{1,2}):?(\d{2})?/i);
                if (match) {
                    const sign = match[1] === '+' ? 1 : -1;
                    const hours = parseInt(match[2], 10);
                    const minutes = parseInt(match[3] || '0', 10);
                    const timezoneOffsetMinutes = sign * (hours * 60 + minutes);
                    
                    // IST is UTC+5:30 (330 minutes)
                    const istOffsetMinutes = 330;
                    
                    // Calculate the difference and adjust
                    const offsetDifference = istOffsetMinutes - timezoneOffsetMinutes;
                    const adjustedDate = new Date(date.getTime() + offsetDifference * 60 * 1000);
                    
                    return adjustedDate;
                }
            }
            
            // If no timezone or invalid format, return original date
            return date;
        } catch (error) {
            console.error('Error converting timezone:', error);
            return new Date(dateStr);
        }
    };

    const formatDisplayDate = (dateStr, timezone) => {
        if (!dateStr) return "N/A";
        
        const adjustedDate = convertToIST(dateStr, timezone);
        
        if (adjustedDate) {
            return adjustedDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                timeZone: 'Asia/Kolkata'
            }) + ' (IST)';
        }
        
        return new Date(dateStr).toLocaleDateString();
    };

    const initialFormState = {
        venue: "",
        year: "",
        url: "",
        added_by: user?.id || "",
        status: "Active",
        abstract_submission: "",
        paper_submission: "",
        author_response: "",
        meta_review: "",
        notification: "",
        commitment: "",
        main_conference_start: "",
        main_conference_end: "",
        location: "",
        time_zone: "",
        view: [],
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (!user) {
            navigate("/");
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [venuesRes, usersRes, allVenuesRes] = await Promise.all([
                    axios.get(`/api/v1/venues/${user.id}`),
                    user.role === "faculty" ? 
                        axios.get(`/api/v1/user/${user?.id}`) :
                        axios.get(`/api/v1/user/studentConnection/${user?.id}`),
                    axios.get('/api/v1/venues/venues${}', {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token') || ''}`
                        }
                    })
                ]);
                setVenues(venuesRes.data.venues || venuesRes.data);
                
                setUsers(usersRes.data);
            
                setAllVenues(allVenuesRes.data);
            } catch (error) {
                console.error("Error fetching data:", error);
                setMessage("Failed to fetch data");
            }
            setLoading(false);
        };
        if (user?.id) fetchData();
    }, [user]);

    useEffect(() => {
        if (selectedVenue) {
            setFormData({
                venue: selectedVenue.venue || "",
                year: selectedVenue.year || "",
                url: selectedVenue.url || "",
                added_by: selectedVenue.added_by?._id || selectedVenue.added_by || user?.id,
                status: selectedVenue.status || "Active",
                abstract_submission: selectedVenue.abstract_submission ? selectedVenue.abstract_submission.split('T')[0] : "",
                paper_submission: selectedVenue.paper_submission ? selectedVenue.paper_submission.split('T')[0] : "",
                author_response: selectedVenue.author_response ? selectedVenue.author_response.split('T')[0] : "",
                meta_review: selectedVenue.meta_review ? selectedVenue.meta_review.split('T')[0] : "",
                notification: selectedVenue.notification ? selectedVenue.notification.split('T')[0] : "",
                commitment: selectedVenue.commitment ? selectedVenue.commitment.split('T')[0] : "",
                main_conference_start: selectedVenue.main_conference_start ? selectedVenue.main_conference_start.split('T')[0] : "",
                main_conference_end: selectedVenue.main_conference_end ? selectedVenue.main_conference_end.split('T')[0] : "",
                location: selectedVenue.location || "",
                time_zone: selectedVenue.time_zone || "",
                view: selectedVenue.view || [],
            });
        }
    }, [selectedVenue, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Handle venue input changes for autocomplete
        if (name === 'venue') {
            if (value.length > 0) {
                const filtered = allVenues.filter(venue => 
                    venue.toLowerCase().includes(value.toLowerCase())
                );
                setFilteredVenueSuggestions(filtered);
                setShowVenueSuggestions(true);
            } else {
                setShowVenueSuggestions(false);
            }
        }
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            view: checked
                ? [...prevState.view, value]
                : prevState.view.filter((id) => id !== value),
        }));
    };

    const handleVenueSuggestionClick = (venueName) => {
        setFormData({ ...formData, venue: venueName });
        setShowVenueSuggestions(false);
    };

    const handleVenueInputBlur = () => {
        setTimeout(() => setShowVenueSuggestions(false), 200);
    };

    const handleVenueInputFocus = () => {
        if (formData.venue.length > 0 && filteredVenueSuggestions.length > 0) {
            setShowVenueSuggestions(true);
        } else if (formData.venue.length === 0 && allVenues.length > 0) {
            setFilteredVenueSuggestions(allVenues);
            setShowVenueSuggestions(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!window.confirm("Are you sure?")) return;

        // Check permissions for editing
        if (selectedVenue && !canEditVenue(selectedVenue)) {
            setMessage("Permission denied. You can only edit venues you created or are authorized to view.");
            return;
        }

        try {
            const submitData = { ...formData, added_by: user.id };
            const response = selectedVenue
                ? await axios.put(`/api/v1/venues/${selectedVenue._id}`, submitData)
                : await axios.post("/api/v1/venues", submitData);

            setMessage(selectedVenue ? "Venue updated!" : "Venue created!");
            setVenues(selectedVenue
                ? venues.map(v => v._id === response.data._id ? response.data : v)
                : [...venues, response.data]
            );
            
            // Refresh venue suggestions
            const allVenuesRes = await axios.get('/api/v1/venues/venues', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
                }
            });
            setAllVenues(allVenuesRes.data);
            
            resetForm();
        } catch (error) {
            console.error("Error saving venue:", error);
            setMessage("Failed to save venue");
        }
    };

    const handleDelete = async (venueId) => {
        if (!window.confirm("Delete this venue?")) return;
        
        try {
            await axios.delete(`/api/v1/venues/${venueId}`);
            setVenues(venues.filter(v => v._id !== venueId));
            if (selectedVenue?._id === venueId) resetForm();
            setMessage("Venue deleted");
            
            // Refresh venue suggestions
            const allVenuesRes = await axios.get('/api/v1/venues/venues', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
                }
            });
            setAllVenues(allVenuesRes.data);
        } catch (error) {
            console.error("Error deleting venue:", error);
            setMessage("Failed to delete venue");
        }
    };

    const resetForm = () => {
        setSelectedVenue(null);
        setFormData(initialFormState);
        setVenueSearch("");
        setTeamSearch("");
    };

    const filteredVenues = venues.filter(venue => {
        const matchesSearch = venue.venue?.toLowerCase().includes(venueSearch.toLowerCase()) ||
                             venue.location?.toLowerCase().includes(venueSearch.toLowerCase());
        const matchesStatus = showAllVenues || (!venue.status || venue.status === 'Active');
        return matchesSearch && matchesStatus;
    });

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(teamSearch.toLowerCase())
    );

    return (
        <div className="projectAddForm-container">
            <div className="projectAddForm-header">
                <button onClick={() => navigate(-1)} className="projectAddForm-back-button">
                    <FontAwesomeIcon icon={faArrowLeft} /> Back
                </button>
                <h2 className="projectAddForm-title">
                    {selectedVenue ? "Edit Conference Venue" : "Add New Conference Venue"}
                </h2>
            </div>

            {message && (
                <div className={`projectAddForm-message ${message.includes("Failed") ? "error" : "success"}`}>
                    {message}
                    <button onClick={() => setMessage("")} className="projectAddForm-message-close">&times;</button>
                </div>
            )}

            <div className="projectAddForm-layout">
                {/* Venues List Panel */}
                <div className="projectAddForm-projects-panel">
                    <div className="projectAddForm-panel-header">
                        <h3 className="projectAddForm-panel-title">
                            <FontAwesomeIcon icon={faCalendarAlt} /> Your Venues
                        </h3>
                        <div className="projectAddForm-panel-controls">
                            <div className="projectAddForm-search-container">
                                <input
                                    type="text"
                                    placeholder="Search venues..."
                                    value={venueSearch}
                                    onChange={(e) => setVenueSearch(e.target.value)}
                                />
                                <FontAwesomeIcon icon={faSearch} className="projectAddForm-search-icon" />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAllVenues(!showAllVenues)}
                                className={`projectAddForm-toggle-button ${showAllVenues ? 'active' : ''}`}
                                title={showAllVenues ? "Show Active Only" : "Show All Venues"}
                            >
                                {showAllVenues ? "All" : "Active"}
                            </button>
                        </div>
                    </div>

                    <div className="projectAddForm-projects-list">
                        {filteredVenues.length > 0 ? (
                            filteredVenues.map(venue => {
                                const canEdit = canEditVenue(venue);
                                return (
                                    <div 
                                        key={venue._id}
                                        className={`projectAddForm-project-item ${selectedVenue?._id === venue._id ? "active" : ""} ${!canEdit ? "read-only" : ""}`}
                                        onClick={() => canEdit && setSelectedVenue(venue)}
                                        style={{ cursor: canEdit ? 'pointer' : 'default', opacity: canEdit ? 1 : 0.6 }}
                                    >
                                        <div className="projectAddForm-project-name">
                                            {venue.venue}
                                            {!canEdit && <FontAwesomeIcon icon={faUser} style={{marginLeft: '8px', color: '#999'}} title="View only - no edit permission" />}
                                        </div>
                                        <div className="projectAddForm-project-meta">
                                            {venue.year && (
                                                <span className="projectAddForm-status-badge ongoing">
                                                    {venue.year}
                                                </span>
                                            )}
                                            {venue.location && (
                                                <span><FontAwesomeIcon icon={faMapMarkerAlt} /> {venue.location}</span>
                                            )}
                                            {venue.paper_submission && (
                                                <span><FontAwesomeIcon icon={faCalendarAlt} /> {formatDisplayDate(venue.paper_submission, venue.time_zone)}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="projectAddForm-empty-state">
                                <FontAwesomeIcon icon={faCalendarAlt} size="2x" className="projectAddForm-empty-icon" />
                                {loading ? <p>Fetching Venues...</p> : <p>No venues found</p>}
                                {venueSearch && (
                                    <button 
                                        onClick={() => setVenueSearch("")}
                                        className="projectAddForm-clear-search-button"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Panel */}
                <div className="projectAddForm-form-panel">
                    <form onSubmit={handleSubmit} className="projectAddForm-form">
                        {/* Basic Information Section */}
                        <div className="projectAddForm-form-section">
                            <div className="projectAddForm-section-header">
                                <FontAwesomeIcon icon={faCalendarAlt} className="projectAddForm-section-icon" />
                                <h3 className="projectAddForm-section-title">Basic Information</h3>
                            </div>
                            <div className="projectAddForm-form-grid">
                                <div className="projectAddForm-form-group venue-input-group">
                                    <label className="projectAddForm-label">
                                        <FontAwesomeIcon icon={faCalendarAlt} /> Venue Name*
                                    </label>
                                    <div className="venue-input-container">
                                        <input
                                            type="text"
                                            name="venue"
                                            value={formData.venue}
                                            onChange={handleChange}
                                            onFocus={handleVenueInputFocus}
                                            onBlur={handleVenueInputBlur}
                                            required
                                            placeholder="e.g., ACM Conference"
                                            autoComplete="off"
                                            className="projectAddForm-input"
                                        />
                                        {showVenueSuggestions && filteredVenueSuggestions.length > 0 && (
                                            <div className="venue-suggestions">
                                                {filteredVenueSuggestions.slice(0, 5).map((venue, index) => (
                                                    <div 
                                                        key={index} 
                                                        className="venue-suggestion-item"
                                                        onClick={() => handleVenueSuggestionClick(venue)}
                                                    >
                                                        {venue}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="projectAddForm-form-group">
                                    <label className="projectAddForm-label">
                                        <FontAwesomeIcon icon={faCalendarAlt} /> Year
                                    </label>
                                    <input
                                        type="number"
                                        name="year"
                                        value={formData.year}
                                        onChange={handleChange}
                                        min="1900"
                                        placeholder="2023"
                                        className="projectAddForm-input"
                                    />
                                </div>
                                <div className="projectAddForm-form-group">
                                    <label className="projectAddForm-label">
                                        <FontAwesomeIcon icon={faLink} /> Website URL
                                    </label>
                                    <input
                                        type="url"
                                        name="url"
                                        value={formData.url}
                                        onChange={handleChange}
                                        placeholder="https://conference.example.com"
                                        className="projectAddForm-input"
                                    />
                                </div>
                                <div className="projectAddForm-form-group">
                                    <label className="projectAddForm-label">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} /> Location
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="City, Country"
                                        className="projectAddForm-input"
                                    />
                                </div>
                                <div className="projectAddForm-form-group">
                                    <label className="projectAddForm-label">
                                        <FontAwesomeIcon icon={faClock} /> Time Zone
                                    </label>
                                    <input
                                        type="text"
                                        name="time_zone"
                                        value={formData.time_zone}
                                        onChange={handleChange}
                                        placeholder="UTC+5:30"
                                        className="projectAddForm-input"
                                    />
                                </div>
                                <div className="projectAddForm-form-group">
                                    <label className="projectAddForm-label">
                                        <FontAwesomeIcon icon={faEdit} /> Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="projectAddForm-input"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Important Dates Section */}
                        <div className="projectAddForm-form-section">
                            <div className="projectAddForm-section-header">
                                <FontAwesomeIcon icon={faCalendarAlt} className="projectAddForm-section-icon" />
                                <h3 className="projectAddForm-section-title">Important Dates</h3>
                            </div>
                            <div className="projectAddForm-form-grid">
                                <div className="projectAddForm-form-group">
                                    <label className="projectAddForm-label">Abstract Submission</label>
                                    <input
                                        type="date"
                                        name="abstract_submission"
                                        value={formData.abstract_submission}
                                        onChange={handleChange}
                                        className="projectAddForm-input"
                                    />
                                </div>
                                <div className="projectAddForm-form-group">
                                    <label className="projectAddForm-label">Paper Submission</label>
                                    <input
                                        type="date"
                                        name="paper_submission"
                                        value={formData.paper_submission}
                                        onChange={handleChange}
                                        className="projectAddForm-input"
                                    />
                                </div>
                                <div className="projectAddForm-form-group">
                                    <label className="projectAddForm-label">Author Response</label>
                                    <input
                                        type="date"
                                        name="author_response"
                                        value={formData.author_response}
                                        onChange={handleChange}
                                        className="projectAddForm-input"
                                    />
                                </div>
                                <div className="projectAddForm-form-group">
                                    <label className="projectAddForm-label">Meta Review</label>
                                    <input
                                        type="date"
                                        name="meta_review"
                                        value={formData.meta_review}
                                        onChange={handleChange}
                                        className="projectAddForm-input"
                                    />
                                </div>
                                <div className="projectAddForm-form-group">
                                    <label className="projectAddForm-label">Notification</label>
                                    <input
                                        type="date"
                                        name="notification"
                                        value={formData.notification}
                                        onChange={handleChange}
                                        className="projectAddForm-input"
                                    />
                                </div>
                                <div className="projectAddForm-form-group">
                                    <label className="projectAddForm-label">Commitment</label>
                                    <input
                                        type="date"
                                        name="commitment"
                                        value={formData.commitment}
                                        onChange={handleChange}
                                        className="projectAddForm-input"
                                    />
                                </div>
                                <div className="projectAddForm-form-group">
                                    <label className="projectAddForm-label">Conference Start</label>
                                    <input
                                        type="date"
                                        name="main_conference_start"
                                        value={formData.main_conference_start}
                                        onChange={handleChange}
                                        className="projectAddForm-input"
                                    />
                                </div>
                                <div className="projectAddForm-form-group">
                                    <label className="projectAddForm-label">Conference End</label>
                                    <input
                                        type="date"
                                        name="main_conference_end"
                                        value={formData.main_conference_end}
                                        onChange={handleChange}
                                        className="projectAddForm-input"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Access Control Section */}
                        <div className="projectAddForm-form-section">
                            <div className="projectAddForm-section-header">
                                <FontAwesomeIcon icon={faUser} className="projectAddForm-section-icon" />
                                <h3 className="projectAddForm-section-title">Access Control</h3>
                            </div>
                            <div className="projectAddForm-form-group">
                                <div className="projectAddForm-search-container">
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={teamSearch}
                                        onChange={(e) => setTeamSearch(e.target.value)}
                                        className="projectAddForm-search-input"
                                    />
                                    <FontAwesomeIcon icon={faSearch} className="projectAddForm-search-icon" />
                                </div>
                                <div className="projectAddForm-team-members-list">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(userItem => (
                                            <label key={userItem._id} className="projectAddForm-team-member-checkbox">
                                                <input
                                                    type="checkbox"
                                                    value={userItem._id}
                                                    checked={formData.view.includes(userItem._id)}
                                                    onChange={handleCheckboxChange}
                                                    className="projectAddForm-checkbox-input"
                                                />
                                                <span className="projectAddForm-checkmark"></span>
                                                <span className="projectAddForm-member-name">{userItem.name}</span>
                                                <span className="projectAddForm-member-role">{userItem.email}</span>
                                            </label>
                                        ))
                                    ) : (
                                        <div className="projectAddForm-empty-state">
                                            No users found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="projectAddForm-form-actions">
                            <button type="submit" className="projectAddForm-submit-button">
                                <FontAwesomeIcon icon={faSave} />
                                {selectedVenue ? "Update Venue" : "Create Venue"}
                            </button>
                            {selectedVenue && (
                                <button
                                    type="button"
                                    onClick={() => handleDelete(selectedVenue._id)}
                                    className="projectAddForm-delete-button"
                                >
                                    <FontAwesomeIcon icon={faTrashAlt} /> Delete
                                </button>
                            )}
                            {selectedVenue && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="projectAddForm-cancel-button"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VenueAddForm;