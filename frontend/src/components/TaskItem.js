import React from 'react';
import '../styles/TaskItem.css';

const TaskItem = ({ task, onEdit, onDelete }) => {
  const getPriorityClass = (priority) => `priority-${priority}`;
  const getStatusClass = (status) => `status-${status.replace('-', '')}`;
  const getCategoryIcon = (category) => {
    const icons = {
      homework: '📝',
      project: '💼',
      exam: '📋',
      assignment: '📄',
      other: '📌'
    };
    return icons[category] || '📌';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, className: 'overdue' };
    } else if (diffDays === 0) {
      return { text: 'Due today', className: 'due-today' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', className: 'due-soon' };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, className: 'due-soon' };
    } else {
      return { text: date.toLocaleDateString(), className: 'due-later' };
    }
  };

  const dueDateInfo = task.dueDate ? formatDate(task.dueDate) : null;

  return (
    <div className={`task-item ${getStatusClass(task.status)}`}>
      <div className="task-header">
        <div className="task-category-icon">
          {getCategoryIcon(task.category)}
        </div>
        <div className="task-actions">
          <button
            className="action-btn edit-btn"
            onClick={() => onEdit(task)}
            title="Edit task"
          >
            ✏️
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => onDelete(task._id)}
            title="Delete task"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="task-body">
        <h3 className="task-title">{task.title}</h3>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
      </div>

      <div className="task-footer">
        <div className="task-tags">
          <span className={`task-category ${task.category}`}>
            {task.category}
          </span>
          <span className={`task-priority ${getPriorityClass(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`task-status ${getStatusClass(task.status)}`}>
            {task.status.replace('-', ' ')}
          </span>
        </div>

        {dueDateInfo && (
          <div className={`task-due-date ${dueDateInfo.className}`}>
            {dueDateInfo.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;