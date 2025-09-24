// src/components/playlists/PlaylistActions.tsx
import { useState } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Plus, ListMusic, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlaylist } from '@/context/PlaylistContext';
import AddToPlaylistModal from './AddToPlaylistModal';
import { useAuth } from '@/context/AuthContext';

interface PlaylistActionsProps {
  itemId: string;
  itemType: 'track' | 'lesson' | 'video' | 'audio';
  itemData: any;
}

export const PlaylistActions: React.FC<PlaylistActionsProps> = ({ itemId, itemType, itemData }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { addItemToQueue, playlists, createPlaylist, addToPlaylist } = usePlaylist();
  const { user } = useAuth();

  const handleAddToNew = async (name: string) => {
    const playlistId = await createPlaylist(name);
    await addToPlaylist(playlistId, itemId, itemType);
    setShowCreateForm(false);
  };

  const handlePlayNext = () => {
    const playableItem = {
      id: itemId,
      type: itemType,
      title: itemData.title || itemData.name,
      artist: itemData.artist || 'Unknown',
      src: itemData.audio_path || itemData.src,
      artwork: itemData.cover_path || itemData.artwork,
      duration: itemData.duration || 0,
      slug: itemData.slug,
      metadata: itemData.metadata || {}
    };
    
    addItemToQueue(playableItem, true);
  };

  const handleAddToQueue = () => {
    const playableItem = {
      id: itemId,
      type: itemType,
      title: itemData.title || itemData.name,
      artist: itemData.artist || 'Unknown',
      src: itemData.audio_path || itemData.src,
      artwork: itemData.cover_path || itemData.artwork,
      duration: itemData.duration || 0,
      slug: itemData.slug,
      metadata: itemData.metadata || {}
    };
    
    addItemToQueue(playableItem, false);
  };

  if (!user) return null;

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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  handleAddToNew(target.value);
                }
              }}
              className="border rounded p-1 w-full mb-2"
            />
            <Button onClick={() => {
              const input = document.querySelector('input[type="text"]') as HTMLInputElement;
              if (input?.value) {
                handleAddToNew(input.value);
              }
            }} size="sm">
              Create
            </Button>
          </div>
        ) : (
          <>
            <DropdownMenuItem onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Playlist
            </DropdownMenuItem>
            <AddToPlaylistModal itemId={itemId} itemType={itemType} userId={user.id}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <ListMusic className="mr-2 h-4 w-4" />
                Add to Existing
              </DropdownMenuItem>
            </AddToPlaylistModal>
            <DropdownMenuItem onClick={handlePlayNext}>
              <Play className="mr-2 h-4 w-4" />
              Play Next
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddToQueue}>
              <Plus className="mr-2 h-4 w-4" />
              Add to Queue
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
