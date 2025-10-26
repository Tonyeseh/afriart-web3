"use client";

import { ArtistDirectory } from '../components/ArtistDirectory';
import { useToast } from '../components/Toast';

export default function ArtistPage() {
  const { showToast } = useToast();

  return (
    <ArtistDirectory 
      onViewArtist={(artist) => {
        console.log('View artist:', artist);
        showToast('success', `Viewing ${artist.displayName}'s profile`);
      }}
    />
  );
}
