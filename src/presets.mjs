/** The export presets the cloud render accepts. Mirrors the editor's own list. */
export const EXPORT_PRESETS = [
  { id: 'source', label: 'Same as project', size: null },
  { id: 'vertical', label: 'Vertical 9:16', size: { width: 1080, height: 1920 }, note: 'TikTok, Reels, Shorts' },
  { id: 'square', label: 'Square 1:1', size: { width: 1080, height: 1080 }, note: 'Feed' },
  { id: 'portrait', label: 'Portrait 4:5', size: { width: 1080, height: 1350 }, note: 'Instagram feed' },
  { id: 'landscape', label: 'Landscape 16:9', size: { width: 1920, height: 1080 }, note: 'YouTube' },
  { id: 'hd720', label: '720p 16:9', size: { width: 1280, height: 720 } },
  { id: 'uhd2160', label: '4K 16:9', size: { width: 3840, height: 2160 }, note: 'Slow, and large' },
];

export const CONTAINERS = ['webm', 'mp4', 'mkv', 'mov'];
