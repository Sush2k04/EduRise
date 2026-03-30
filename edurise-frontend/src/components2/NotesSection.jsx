import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Download, 
  Clock, 
  BookOpen,
  Search,
  Tag,
  Star,
  Copy
} from 'lucide-react';

const NotesSection = () => {
  const [notes, setNotes] = useState([
    {
      id: 1,
      title: 'React Hooks Introduction',
      content: 'useState and useEffect are fundamental hooks for managing state and side effects.',
      timestamp: '2:30 PM',
      videoTime: '05:23',
      tags: ['hooks', 'react'],
      isStarred: true
    },
    {
      id: 2,
      title: 'Component Architecture',
      content: 'Breaking down components into smaller, reusable pieces improves maintainability.',
      timestamp: '2:35 PM',
      videoTime: '08:45',
      tags: ['components', 'architecture'],
      isStarred: false
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tags: ''
  });

  const textareaRef = useRef(null);

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const note = {
      id: Date.now(),
      title: newNote.title,
      content: newNote.content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      videoTime: '12:34', // Current video time would be passed from parent
      tags: newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      isStarred: false
    };

    setNotes([...notes, note]);
    setNewNote({ title: '', content: '', tags: '' });
    setIsCreating(false);
  };

  const handleEditNote = (note) => {
    setEditingNote(note.id);
    setNewNote({
      title: note.title,
      content: note.content,
      tags: note.tags.join(', ')
    });
  };

  const handleSaveEdit = () => {
    setNotes(notes.map(note =>
      note.id === editingNote
        ? {
            ...note,
            title: newNote.title,
            content: newNote.content,
            tags: newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
          }
        : note
    ));
    setEditingNote(null);
    setNewNote({ title: '', content: '', tags: '' });
  };

  const handleDeleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const toggleStar = (id) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, isStarred: !note.isStarred } : note
    ));
  };

  const exportNotes = () => {
    const notesText = notes.map(note => 
      `${note.title}\n${note.content}\nTags: ${note.tags.join(', ')}\nVideo Time: ${note.videoTime}\n\n`
    ).join('');
    
    const element = document.createElement('a');
    const file = new Blob([notesText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'edurise-notes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyNoteContent = (content) => {
    navigator.clipboard.writeText(content);
    // You could add a toast notification here
  };

  return (
    <div className="flex flex-col h-full">
      {/* Notes Header */}
      <div className="p-4 border-b border-purple-500/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Session Notes</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportNotes}
              className="p-2 hover:bg-purple-500/20 rounded-full transition-colors"
              title="Export Notes"
            >
              <Download className="w-4 h-4 text-gray-400 hover:text-purple-400" />
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all"
              title="Add Note"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-slate-700 border border-purple-500/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors text-sm"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Create New Note Form */}
        {isCreating && (
          <div className="bg-slate-700/50 border border-purple-500/20 rounded-lg p-4">
            <input
              type="text"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              placeholder="Note title..."
              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none font-medium mb-3"
            />
            
            <textarea
              ref={textareaRef}
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              placeholder="Write your note here..."
              rows={4}
              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none text-sm mb-3"
            />
            
            <input
              type="text"
              value={newNote.tags}
              onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
              placeholder="Tags (separated by commas)"
              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm mb-3"
            />
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCreateNote}
                className="bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-lg text-white text-sm hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewNote({ title: '', content: '', tags: '' });
                }}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Existing Notes */}
        {filteredNotes.map((note) => (
          <div key={note.id} className="bg-slate-700/30 border border-purple-500/10 rounded-lg p-4 hover:border-purple-500/20 transition-colors group">
            {editingNote === note.id ? (
              <div>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full bg-transparent text-white focus:outline-none font-medium mb-3"
                />
                
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={4}
                  className="w-full bg-transparent text-white focus:outline-none resize-none text-sm mb-3"
                />
                
                <input
                  type="text"
                  value={newNote.tags}
                  onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                  placeholder="Tags (separated by commas)"
                  className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm mb-3"
                />
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveEdit}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-lg text-white text-sm hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingNote(null);
                      setNewNote({ title: '', content: '', tags: '' });
                    }}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-white text-sm">{note.title}</h4>
                    <button
                      onClick={() => toggleStar(note.id)}
                      className={`p-1 rounded transition-colors ${
                        note.isStarred 
                          ? 'text-yellow-400 hover:text-yellow-300' 
                          : 'text-gray-500 hover:text-yellow-400'
                      }`}
                    >
                      <Star className="w-3 h-3" fill={note.isStarred ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                    <button
                      onClick={() => copyNoteContent(note.content)}
                      className="p-1 hover:bg-purple-500/20 rounded transition-colors"
                      title="Copy content"
                    >
                      <Copy className="w-3 h-3 text-gray-400 hover:text-purple-400" />
                    </button>
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-1 hover:bg-purple-500/20 rounded transition-colors"
                      title="Edit note"
                    >
                      <Edit3 className="w-3 h-3 text-gray-400 hover:text-purple-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-3 leading-relaxed">{note.content}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{note.timestamp}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-purple-400">
                      <BookOpen className="w-3 h-3" />
                      <span>{note.videoTime}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {note.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredNotes.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h4 className="text-gray-400 font-medium mb-2">No notes yet</h4>
            <p className="text-gray-500 text-sm">Start taking notes during the session!</p>
          </div>
        )}
      </div>

      {/* Notes Stats */}
      <div className="p-4 border-t border-purple-500/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{notes.length} notes total</span>
          <span className="text-gray-400">{notes.filter(n => n.isStarred).length} starred</span>
        </div>
      </div>
    </div>
  );
};

export default NotesSection;