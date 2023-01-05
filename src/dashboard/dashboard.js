import { fetchRequest } from "../api";
import { getItemFromLocalStorage, setItemInLocalStorage } from "../common";
import { ENDPOINT, LOADED_TRACKS, logout, SECTIONTYPE } from "../common";

const audio = new Audio();
let displayName;
// const volume = document.querySelector("#volume");
const playButton = document.querySelector("#play");
// const totalSongDuration = document.querySelector("#total-song-duration");
// const songDurationCompleted = document.querySelector(
//   "#song-duration-completed"
// );
// const songProgress = document.querySelector("#progress");
// const timeline = document.querySelector("#timeline");
// let progressInterval;

const onProfileClick = (event) => {
  event.stopPropagation();
  const profileMenu = document.querySelector("#profile-menu");
  profileMenu.classList.toggle("hidden");
  if (!profileMenu.classList.contains("hidden")) {
    profileMenu.querySelector("li#logout").addEventListener("click", logout);
  }
};

const loadUserProfile = async () => {
  return new Promise(async (resolve, reject) => {
    const defaultImage = document.querySelector("#default-image");
    const profileImage = document.querySelector("#profile-image");
    const profileButton = document.querySelector("#user-profile-btn");
    const displayNameElement = document.querySelector("#display-name");

    const { display_name: displayName, images } = await fetchRequest(
      ENDPOINT.userInfo
    );

    if (images?.length) {
      defaultImage.classList.add("hidden");
      profileImage.src = `${images[0].url}`;
      profileImage.classList.remove("hidden");
    } else {
      defaultImage.classList.remove("hidden");
    }

    profileButton.addEventListener("click", onProfileClick);

    displayNameElement.textContent = displayName;
    resolve({ displayName });
  });
};

const onPlaylistItemClicked = (event, id) => {
  const section = { type: SECTIONTYPE.PLAYLIST, playlist: id };
  history.pushState(section, "", `playlist/${id}`);
  loadSection(section);
};

const loadPlaylist = async (endpoint, elementId) => {
  const {
    playlists: { items },
  } = await fetchRequest(endpoint);

  const playlistItemsSection = document.querySelector(`#${elementId}`);
  for (let { name, description, images, id } of items) {
    let playlistItem = document.createElement("section");
    playlistItem.className =
      "bg-black-secondary rounded p-4 hover:cursor-pointer hover:bg-light-black";
    playlistItem.id = id;
    playlistItem.setAttribute("data-type", "playlist");
    playlistItem.addEventListener("click", (event) =>
      onPlaylistItemClicked(event, id)
    );
    const [image] = images;
    playlistItem.innerHTML += `<img src="${image.url}" alt="${name}" class="rounded mb-2 object-contain shadow" />
              <h2 class="text-base font-semibold mb-4 truncate">${name}</h2>
              <h3 class="text-sm text-secondary line-clamp-2">${description}</h3>`;
    playlistItemsSection.appendChild(playlistItem);
  }
};

const loadPlaylists = () => {
  loadPlaylist(ENDPOINT.featuredPlaylist, "featured-playlist-items");
  loadPlaylist(ENDPOINT.toplists, "toplists-playlist-items");
};

const fillContentForDashboard = () => {
  const coverContent = document.querySelector("#cover-content");
  coverContent.innerHTML = `<h1 class="text-6xl">Hello, ${displayName}</h1>`;
  const pageContent = document.querySelector("#page-content");
  const playlistMap = new Map([
    ["featured", "featured-playlist-items"],
    ["top playlists", "toplists-playlist-items"],
  ]);
  let innerHTML = "";
  for (let [type, id] of playlistMap) {
    innerHTML += `
        <article class="p-4">
          <h1 class="mb-4 text-2xl font-bold capitalize">${type}</h1>
          <section
            id="${id}"
            class="grid grid-cols-auto-fill-cards gap-4"
          ></section>
        </article>`;
  }
  pageContent.innerHTML = innerHTML;
};

const formatTime = (duration) => {
  const min = Math.floor(duration / 60_000);
  const sec = ((duration % 60_000) / 1000).toFixed(0);
  const formattedTime =
    sec == 60 ? min + 1 + ":00" : min + ":" + (sec < 10 ? "0" : "") + sec;
  return formattedTime;
};

const onTrackSelection = (id, event) => {
  document.querySelectorAll("#tracks .track").forEach((trackItem) => {
    if (trackItem.id === id) {
      trackItem.classList.add("bg-gray", "selected");
    } else {
      trackItem.classList.remove("bg-gray", "selected");
    }
  });
};

// const timeline = document.querySelector("#")

const updateIconsForPlayMode = (id) => {
  const playButton = document.querySelector("#play");
  playButton.querySelector("span").textContent = "pause_circle";
  const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
  if (playButtonFromTracks) {
    playButtonFromTracks.textContent = "pause";
  }
};

const updateIconsForPauseMode = (id) => {
  const playButton = document.querySelector("#play");
  playButton.querySelector("span").textContent = "play_circle";
  const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
  if (playButtonFromTracks) {
    playButtonFromTracks.textContent = "play_arrow";
  }
};

const onAudioMetaDataLoaded = (id) => {
  const totalSongDuration = document.querySelector("#total-song-duration");
  totalSongDuration.textContent = `0:${audio.duration.toFixed(0)}`;
};

const onNowPlayingPlayButtonClicked = (id) => {
  if (audio.paused) {
    audio.play();
    updateIconsForPlayMode(id);
  } else {
    audio.pause();
    updateIconsForPauseMode(id);
  }
};

const togglePlay = () => {
  if (audio.src) {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }
};

const findCurrentTrack = () => {
  const audioControl = document.querySelector("#audio-control");
  const trackId = audioControl.getAttribute("data-track-id");
  if (trackId) {
    const loadedTracks = getItemFromLocalStorage(LOADED_TRACKS);
    const currentTrackIndex = loadedTracks?.findIndex(
      (trk) => trk.id === trackId
    );
    return { currentTrackIndex, tracks: loadedTracks };
  }
  return null;
};

const playNextTrack = () => {
  const { currentTrackIndex = -1, tracks = null } = findCurrentTrack() ?? {};
  if (currentTrackIndex > -1 && currentTrackIndex < tracks?.length - 1) {
    playTrack(null, tracks[currentTrackIndex + 1]);
  }
};

const playPrevTrack = () => {
  const { currentTrackIndex = -1, tracks = null } = findCurrentTrack() ?? {};
  if (currentTrackIndex > 0) {
    playTrack(null, tracks[currentTrackIndex - 1]);
  }
};

const playTrack = (
  event,
  { image, artistNames, name, duration, previewUrl, id }
) => {
  if (event?.stopPropagation) {
    event.stopPropagation();
  }
  if (audio.src === previewUrl) {
    togglePlay();
  } else {
    const nowPlayingSongImage = document.querySelector("#now-playing-image");
    const nowPlayingSongTitle = document.querySelector("#now-playing-song");
    const nowPlayingSongArtists = document.querySelector(
      "#now-playing-artists"
    );
    const audioControl = document.querySelector("#audio-control");
    const songInfo = document.querySelector("#song-info");

    audioControl.setAttribute("data-track-id", id);
    nowPlayingSongImage.src = image.url;
    nowPlayingSongTitle.textContent = name;
    nowPlayingSongArtists.textContent = artistNames;

    audio.src = previewUrl;
    audio.removeEventListener("loadedmetadata", () =>
      onAudioMetaDataLoaded(id)
    );
    audio.addEventListener("loadedmetadata", onAudioMetaDataLoaded);
    playButton.addEventListener("click", onNowPlayingPlayButtonClicked(id));
    audio.play();
    songInfo.classList.remove("invisible");
  }
};

const loadPlaylistTracks = ({ tracks }) => {
  const trackSection = document.querySelector("#tracks");
  let trackNo = 1;
  const loadedTracks = [];
  for (let trackItem of tracks.items.filter((item) => item.track.preview_url)) {
    let {
      id,
      artists,
      name,
      album,
      duration_ms: duration,
      preview_url: previewUrl,
    } = trackItem.track;
    let image = album.images.find((img) => img.height === 64);
    let track = document.createElement("section");
    let artistNames = Array.from(artists, (artist) => artist.name).join(", ");
    track.id = id;
    track.classList =
      "track grid grid-cols-[50px_1fr_1fr_50px] p-1 items-center justify-items-start gap-4 rounded-md text-secondary hover:bg-light-black";
    track.innerHTML += `
        <p class="relative w-full flex items-center justify-center justify-self-center"><span class="track-no">${trackNo++}</span></p>
        <section class="grid grid-cols-[auto_1fr] place-items-center gap-2">
          <img class="h-10 w-10" src=${image.url} alt="" />
          <article class="flex flex-col gap-2 justify-center">
            <h2 class="song-title text-base text-primary justify-start line-clamp-1">${name}</h2>
            <p class="text-xs">${artistNames}</p>
          </article>
        </section>
        <p class="text-sm">${album.name}</p>
        <p class="text-sm line-clamp-1">${formatTime(duration)}</p>
    `;
    track.addEventListener("click", (event) => onTrackSelection(id, event));
    const playButton = document.createElement("button");
    playButton.id = `play-track-${id}`;
    playButton.className = `play w-full absolute left-0 text-lg invisible material-symbols-rounded`;
    playButton.textContent = "play_arrow";
    playButton.addEventListener("click", (event) =>
      playTrack(event, { image, artistNames, name, duration, previewUrl, id })
    );
    track.querySelector("p").appendChild(playButton);
    trackSection.appendChild(track);
    loadedTracks.push({
      id,
      artistNames,
      name,
      album,
      duration,
      previewUrl,
      image,
    });
  }
  setItemInLocalStorage(LOADED_TRACKS, loadedTracks);
};

const fillContentForPlaylist = async (playlistId) => {
  const playlist = await fetchRequest(`${ENDPOINT.playlist}/${playlistId}`);
  const { name, images, description, tracks, followers } = playlist;
  const coverElement = document.querySelector("#cover-content");
  coverElement.innerHTML = `
          <section class="flex flex-row justify-start items-end p-4">
            <img class="object-contain h-48 w-48" src=${images[0].url} alt="" />
            <section class="px-4">
              <p class="">PLAYLIST</p>
              <h2 id="playlist-name" class="text-5xl font-extrabold pb-4">${name}</h2>
              <p class="text-secondary" id="playlist-details">${description}</p>
              <p id="playlist-details">${tracks.items.length} songs</p>
            </section>
          </section>`;
  const pageContent = document.querySelector("#page-content");
  pageContent.innerHTML = `
          <header id="playlist-header" class="mx-8 py-4 border-secondary border-b-[0.5px]">
            <nav class="py-2">
              <ul
                class="grid grid-cols-[50px_1fr_1fr_50px] gap-4 text-secondary"
              >
                <li class="justify-self-center">#</li>
                <li>Title</li>
                <li>Album</li>
                <li>🕥</li>
              </ul>
            </nav>
          </header>
          <section id="tracks" class="px-8 text-secondary mt-4">
          </section>
  `;
  loadPlaylistTracks(playlist);
};

const onContentScroll = (e) => {
  const { scrollTop } = e.target;
  const header = document.querySelector(".header");
  if (scrollTop >= header.offsetHeight) {
    header.classList.add("sticky", "top-0", "bg-black");
    header.classList.remove("bg-transparent");
  } else {
    header.classList.add("bg-transparent");
    header.classList.remove("sticky", "top-0", "bg-black-secondary");
  }
  if (history.state.type === SECTIONTYPE.PLAYLIST) {
    const coverElement = document.querySelector("#cover-content");
    const playlistHeader = document.querySelector("#playlist-header");
    if (scrollTop >= coverElement.offsetHeight - header.offsetHeight) {
      playlistHeader.classList.add(
        "sticky",
        "bg-black-secondary",
        "px-8",
        "z-10"
      );
      playlistHeader.classList.remove("mx-8");
      playlistHeader.style.top = `${header.offsetHeight}px`;
    } else {
      playlistHeader.classList.remove("sticky", "bg-black-secondary", "px-8");
      playlistHeader.classList.add("mx-8");
      playlistHeader.style.top = `revert`;
    }
  }
};

const loadSection = (section) => {
  if (section.type === SECTIONTYPE.DASHBOARD) {
    fillContentForDashboard();
    loadPlaylists();
  } else if (section.type === SECTIONTYPE.PLAYLIST) {
    // load elements for the playlist
    fillContentForPlaylist(section.playlist);
  }
  document
    .querySelector(".content")
    .removeEventListener("scroll", onContentScroll);
  document
    .querySelector(".content")
    .addEventListener("scroll", onContentScroll);
};

document.addEventListener("DOMContentLoaded", async () => {
  const volume = document.querySelector("#volume");
  const playButton = document.querySelector("#play");
  const songDurationCompleted = document.querySelector(
    "#song-duration-completed"
  );
  const songProgress = document.querySelector("#progress");
  const timeline = document.querySelector("#timeline");
  const audioControl = document.querySelector("#audio-control");
  const next = document.querySelector("#next");
  const prev = document.querySelector("#prev");
  let progressInterval;
  ({ displayName } = await loadUserProfile());
  const section = { type: SECTIONTYPE.DASHBOARD };
  // const section = {
  //   type: SECTIONTYPE.PLAYLIST,
  //   playlist: "37i9dQZF1DX5cZuAHLNjGz",
  // };
  history.pushState(section, "", "");
  // history.pushState(section, "", `/dashboard/playlist/${section.playlist}`);
  loadSection(section);
  // fillContentForDashboard();
  document.addEventListener("click", () => {
    const profileMenu = document.querySelector("#profile-menu");
    if (!profileMenu.classList.contains("hidden")) {
      profileMenu.classList.add("hidden");
    }
  });

  audio.addEventListener("play", () => {
    const selectedTrackId = audioControl.getAttribute("data-track-id");
    const tracks = document.querySelector("#tracks");
    const playingTrack = tracks?.querySelector("section.playing");
    const selectedTrack = tracks?.querySelector(`[id="${selectedTrackId}"]`);
    if (playingTrack?.id !== selectedTrack?.id) {
      playingTrack?.classList.remove("playing");
    }
    selectedTrack?.classList.add("playing");
    progressInterval = setInterval(() => {
      if (audio.paused) {
        return;
      }
      songDurationCompleted.textContent = formatTime(audio.currentTime * 1000);
      songProgress.style.width = `${
        (audio.currentTime / audio.duration) * 100
      }%`;
    }, 100);
    updateIconsForPlayMode(selectedTrackId);
  });

  audio.addEventListener("pause", () => {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    const selectedTrackId = audioControl.getAttribute("data-track-id");
    updateIconsForPauseMode(selectedTrackId);
  });

  audio.addEventListener("loadedmetadata", () => onAudioMetaDataLoaded());
  playButton.addEventListener("click", togglePlay);

  volume.addEventListener("change", () => {
    audio.volume = volume.value / 100;
  });

  timeline.addEventListener(
    "click",
    (e) => {
      const timelineWidth = window.getComputedStyle(timeline).width;
      const timeToSeek = (e.offsetX / parseInt(timelineWidth)) * audio.duration;
      audio.currentTime = timeToSeek;
      songProgress.style.width = `${
        (audio.currentTime / audio.duration) * 100
      }%`;
    },
    false
  );

  next.addEventListener("click", playNextTrack);
  prev.addEventListener("click", playPrevTrack);

  window.addEventListener("popstate", (event) => {
    loadSection(event.state);
  });
});
