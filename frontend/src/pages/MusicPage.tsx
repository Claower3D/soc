import { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
  Heart, Search, Sparkles, Shuffle, Repeat,
  Flame, Clock
} from 'lucide-react';
import './MusicPage.css';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  durationSeconds: number;
  coverUrl: string;
  audioUrl: string;
  genre: string;
  plays: string;
  isHit?: boolean;
}

const TRACKS: MusicTrack[] = [
  {
    id: 'track-1',
    title: 'Echoes of Serenity (432 Hz Solfeggio)',
    artist: 'Aura Celestia',
    album: 'Sacred Frequencies Vol. 1',
    duration: '3:45',
    durationSeconds: 225,
    coverUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-impromptu-01-112195.mp3',
    genre: 'Zen & 432Hz',
    plays: '142.5k',
    isHit: true
  },
  {
    id: 'track-2',
    title: 'Cyber Mirage',
    artist: 'Neon Horizon',
    album: 'Synthetic Dreams',
    duration: '2:58',
    durationSeconds: 178,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3',
    genre: 'Электроника',
    plays: '289.1k',
    isHit: true
  },
  {
    id: 'track-3',
    title: 'Midnight Coffee Lofi',
    artist: 'Komorebi Beats',
    album: 'Tokyo Rain Memories',
    duration: '2:34',
    durationSeconds: 154,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-study-112191.mp3',
    genre: 'Lofi & Chill',
    plays: '95.4k'
  },
  {
    id: 'track-4',
    title: 'Cosmic Awakening (528 Hz Love)',
    artist: 'Solaris Quintet',
    album: 'Higher Vibration',
    duration: '4:12',
    durationSeconds: 252,
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=ambient-piano-amp-strings-10711.mp3',
    genre: 'Zen & 432Hz',
    plays: '78.2k'
  },
  {
    id: 'track-5',
    title: 'Starlight Drive',
    artist: 'Vapor Waveform',
    album: 'Outrun Odyssey',
    duration: '3:15',
    durationSeconds: 195,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_73b5e40ee8.mp3?filename=synthwave-80s-110046.mp3',
    genre: 'Электроника',
    plays: '310.8k',
    isHit: true
  },
  {
    id: 'track-6',
    title: 'Deep Forest Rain & Piano',
    artist: 'Terra Symphony',
    album: 'Nature Acoustics',
    duration: '3:50',
    durationSeconds: 230,
    coverUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-impromptu-01-112195.mp3',
    genre: 'Zen & 432Hz',
    plays: '64.0k'
  },
  {
    id: 'track-7',
    title: 'Quantum Velocity',
    artist: 'Pulse Architect',
    album: 'Future Bass Laboratory',
    duration: '3:05',
    durationSeconds: 185,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3',
    genre: 'Электроника',
    plays: '185.3k'
  }
];

const PLAYLISTS = [
  {
    id: 'pl-1',
    title: '432 Hz Healing & Zen',
    desc: 'Гармонизация сознания, снятие стресса и восстановление энергии',
    cover: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&auto=format&fit=crop&q=80',
    tracksCount: '24 трека',
    color: 'linear-gradient(135deg, #10B981, #06B6D4)'
  },
  {
    id: 'pl-2',
    title: 'Cyber Synthwave Night',
    desc: 'Неоновые ритмы, ретровейв и энергия ночного мегаполиса',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    tracksCount: '38 треков',
    color: 'linear-gradient(135deg, #8B5CF6, #EC4899)'
  },
  {
    id: 'pl-3',
    title: 'Deep Coding & Focus',
    desc: 'Спокойный Lofi и эмбиент для глубокой продуктивной работы',
    cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
    tracksCount: '45 треков',
    color: 'linear-gradient(135deg, #3B82F6, #6366F1)'
  },
  {
    id: 'pl-4',
    title: 'Чарт Топ-50 New Age',
    desc: 'Самые популярные и прослушиваемые треки сообщества за неделю',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    tracksCount: '50 треков',
    color: 'linear-gradient(135deg, #F59E0B, #EF4444)'
  }
];

const GENRES = ['Все', '🔥 Топ Чарты', 'Zen & 432Hz', 'Электроника', 'Lofi & Chill'];

export function MusicPage() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>(['track-1', 'track-2']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Все');
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = TRACKS[currentTrackIndex] || TRACKS[0];

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    audio.src = currentTrack.audioUrl;
    audio.volume = isMuted ? 0 : volume;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleNextTrack();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleNextTrack = () => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * TRACKS.length);
      setCurrentTrackIndex(randomIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    }
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      return;
    }
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLikedTrackIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredTracks = TRACKS.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          track.album.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedGenre === 'Все') return matchesSearch;
    if (selectedGenre === '🔥 Топ Чарты') return matchesSearch && track.isHit;
    return matchesSearch && track.genre === selectedGenre;
  });

  return (
    <div className="music-page">
      {/* Top Hero Banner */}
      <div className="music-hero">
        <div className="music-hero-backdrop" style={{ backgroundImage: `url(${currentTrack.coverUrl})` }} />
        <div className="music-hero-overlay" />
        
        <div className="music-hero-content">
          <div className="music-hero-badge">
            <Sparkles size={14} />
            <span>NEW AGE SOUND</span>
          </div>
          
          <div className="music-hero-main">
            <div className="music-hero-cover-wrap">
              <img 
                src={currentTrack.coverUrl} 
                alt={currentTrack.title} 
                className={`music-hero-cover ${isPlaying ? 'rotating-cover' : ''}`} 
              />
              <button className="music-hero-play-btn" onClick={togglePlay}>
                {isPlaying ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: 4 }} />}
              </button>
            </div>

            <div className="music-hero-info">
              <span className="music-hero-genre-tag">{currentTrack.genre}</span>
              <h1 className="music-hero-title">{currentTrack.title}</h1>
              <p className="music-hero-artist">{currentTrack.artist} — <i>{currentTrack.album}</i></p>
              
              <div className="music-hero-actions">
                <button className="music-btn music-btn-primary" onClick={togglePlay}>
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  <span>{isPlaying ? 'Пауза' : 'Слушать сейчас'}</span>
                </button>
                <button 
                  className={`music-btn music-btn-secondary ${likedTrackIds.includes(currentTrack.id) ? 'liked' : ''}`}
                  onClick={() => toggleLike(currentTrack.id)}
                >
                  <Heart size={18} fill={likedTrackIds.includes(currentTrack.id) ? '#ec4899' : 'none'} color={likedTrackIds.includes(currentTrack.id) ? '#ec4899' : 'currentColor'} />
                  <span>{likedTrackIds.includes(currentTrack.id) ? 'В медиатеке' : 'В избранное'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Audio Controls Bar */}
      <div className="music-floating-player">
        <div className="player-track-snippet">
          <img src={currentTrack.coverUrl} alt={currentTrack.title} className="player-mini-cover" />
          <div className="player-mini-text">
            <span className="player-mini-title">{currentTrack.title}</span>
            <span className="player-mini-artist">{currentTrack.artist}</span>
          </div>
          <button 
            className="player-icon-btn heart-btn" 
            onClick={() => toggleLike(currentTrack.id)}
          >
            <Heart size={18} fill={likedTrackIds.includes(currentTrack.id) ? '#ec4899' : 'none'} color={likedTrackIds.includes(currentTrack.id) ? '#ec4899' : 'currentColor'} />
          </button>
        </div>

        <div className="player-center-controls">
          <div className="player-buttons-row">
            <button 
              className={`player-icon-btn ${isShuffle ? 'active-toggle' : ''}`} 
              onClick={() => setIsShuffle(!isShuffle)}
              title="Случайный порядок"
            >
              <Shuffle size={16} />
            </button>
            <button className="player-icon-btn" onClick={handlePrevTrack} title="Предыдущий трек">
              <SkipBack size={19} />
            </button>
            <button className="player-main-play-btn" onClick={togglePlay} title={isPlaying ? 'Пауза' : 'Играть'}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
            </button>
            <button className="player-icon-btn" onClick={handleNextTrack} title="Следующий трек">
              <SkipForward size={19} />
            </button>
            <button 
              className={`player-icon-btn ${isRepeat ? 'active-toggle' : ''}`} 
              onClick={() => setIsRepeat(!isRepeat)}
              title="Повтор трека"
            >
              <Repeat size={16} />
            </button>
          </div>

          <div className="player-scrubber-row">
            <span className="player-time-label">{formatSeconds(currentTime)}</span>
            <input 
              type="range" 
              className="player-range-slider" 
              min={0} 
              max={duration || currentTrack.durationSeconds || 100} 
              value={currentTime} 
              onChange={handleSeek} 
            />
            <span className="player-time-label">{formatSeconds(duration || currentTrack.durationSeconds)}</span>
          </div>
        </div>

        <div className="player-volume-controls">
          <button className="player-icon-btn" onClick={toggleMute} title="Звук">
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input 
            type="range" 
            className="player-volume-slider" 
            min={0} 
            max={1} 
            step={0.01} 
            value={isMuted ? 0 : volume} 
            onChange={handleVolumeChange} 
          />
        </div>
      </div>

      {/* Main Browse Container */}
      <div className="music-content-wrap">
        {/* Playlists Horizontal Rail */}
        <section className="music-section">
          <div className="music-section-header">
            <h2 className="music-section-title">Плейлисты и Настроения</h2>
            <span className="music-section-hint">Кураторские подборки</span>
          </div>

          <div className="playlists-grid">
            {PLAYLISTS.map(pl => (
              <div key={pl.id} className="playlist-card" style={{ background: pl.color }}>
                <img src={pl.cover} alt={pl.title} className="playlist-cover" />
                <div className="playlist-info">
                  <h3 className="playlist-title">{pl.title}</h3>
                  <p className="playlist-desc">{pl.desc}</p>
                  <div className="playlist-footer">
                    <span>{pl.tracksCount}</span>
                    <button className="playlist-play-icon-btn" onClick={() => { setCurrentTrackIndex(0); setIsPlaying(true); }}>
                      <Play size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tracks List with Search & Categories */}
        <section className="music-section">
          <div className="music-tracks-toolbar">
            <div className="music-search-bar">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Поиск треков, исполнителей, альбомов..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="music-search-input"
              />
            </div>

            <div className="music-genre-pills">
              {GENRES.map(genre => (
                <button
                  key={genre}
                  className={`genre-pill ${selectedGenre === genre ? 'active' : ''}`}
                  onClick={() => setSelectedGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Tracks Table */}
          <div className="tracks-list-container">
            <div className="tracks-header-row">
              <span className="col-num">#</span>
              <span className="col-title">Название трека</span>
              <span className="col-album">Альбом</span>
              <span className="col-plays">Прослушивания</span>
              <span className="col-duration"><Clock size={15} /></span>
              <span className="col-action"></span>
            </div>

            <div className="tracks-body">
              {filteredTracks.map((trk, idx) => {
                const isCurrent = TRACKS[currentTrackIndex]?.id === trk.id;
                const isLiked = likedTrackIds.includes(trk.id);

                return (
                  <div 
                    key={trk.id} 
                    className={`track-item-row ${isCurrent ? 'active-track' : ''}`}
                    onClick={() => {
                      const realIndex = TRACKS.findIndex(t => t.id === trk.id);
                      if (realIndex !== -1) {
                        setCurrentTrackIndex(realIndex);
                        setIsPlaying(true);
                      }
                    }}
                  >
                    <span className="col-num">
                      {isCurrent && isPlaying ? (
                        <div className="equalizer-anim">
                          <span /><span /><span />
                        </div>
                      ) : (
                        <span className="track-index-num">{idx + 1}</span>
                      )}
                    </span>

                    <div className="col-title track-title-cell">
                      <img src={trk.coverUrl} alt={trk.title} className="track-cell-cover" />
                      <div className="track-cell-meta">
                        <span className="track-cell-name">
                          {trk.title}
                          {trk.isHit && <span className="hit-badge"><Flame size={11} /> ХИТ</span>}
                        </span>
                        <span className="track-cell-artist">{trk.artist}</span>
                      </div>
                    </div>

                    <span className="col-album track-album-name">{trk.album}</span>

                    <span className="col-plays track-plays-count">{trk.plays}</span>

                    <span className="col-duration track-time-text">{trk.duration}</span>

                    <div className="col-action track-actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className={`track-action-btn ${isLiked ? 'liked' : ''}`}
                        onClick={(e) => toggleLike(trk.id, e)}
                        title={isLiked ? 'Удалить из избранного' : 'Добавить в избранное'}
                      >
                        <Heart size={16} fill={isLiked ? '#ec4899' : 'none'} color={isLiked ? '#ec4899' : 'currentColor'} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
