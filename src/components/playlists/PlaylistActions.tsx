// src/components/playlists/PlaylistActions.tsx
import { useState } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Plus, ListMusic, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlaylist } from '@/context/PlaylistContext';

export const PlaylistActions = ({ trackId }: { trackId: string }) => {
  const { createPlaylist, addToPlaylist } = usePlaylist();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleAddToNew = async () => {
    const playlistId = await createPlaylist(newPlaylistName);
    await addToPlaylist(playlistId, trackId);
    setShowCreateForm(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent>
        {showCreateForm ? (
          <div className="px-2 py-1">
            <input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="border rounded p-1 w-full mb-2"
            />
            <Button onClick={handleAddToNew} size="sm">
              Create
            </Button>
          </div>
        ) : (
          <>
            <DropdownMenuItem onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Playlist
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ListMusic className="mr-2 h-4 w-4" />
              Add to Existing
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Play className="mr-2 h-4 w-4" />
              Play Next
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
