import React, { useEffect, useState } from 'react'
import { dummyShowsData } from '../../assets/assets';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { CheckIcon, DeleteIcon, StarIcon } from 'lucide-react';
import { kConverter } from '../../lib/kConverter';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const AddShows = () => {

    const {axios, getToken, user, image_base_url} = useAppContext()

    const currency = import.meta.env.VITE_CURRENCY
    const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [dateTimeSelection, setDateTimeSelection] = useState({});
    const [dateTimeInput, setDateTimeInput] = useState("");
    const [showPrice, setShowPrice] = useState("");
    const [addingShow, setAddingShow] = useState(false)


     const fetchNowPlayingMovies = async () => {
        try {
            const { data } = await axios.get('/api/show/now-playing', {
                headers: { Authorization: `Bearer ${await getToken()}` }})
                if(data.success){
                    setNowPlayingMovies(data.movies)
                }
        } catch (error) {
            console.error('Error fetching movies:', error)
        }
    };

    const handleDateTimeAdd = () => {
        if (!dateTimeInput) return;
        const [date, time] = dateTimeInput.split("T");
        if (!date || !time) return;
        setDateTimeSelection((prev) => {
            const times = prev[date] || [];
            if (!times.includes(time)) {
                return { ...prev, [date]: [...times, time] };
            }
            return prev;
        });
        setDateTimeInput(""); // Clear input after adding
    };

    const handleRemoveTime = (date, time) => {
        setDateTimeSelection((prev) => {
            const filteredTimes = prev[date].filter((t) => t !== time);
            if (filteredTimes.length === 0) {
                const { [date]: _, ...rest } = prev;
                return rest;
            }
            return {
                ...prev,
                [date]: filteredTimes,
            };
        });
    };

    const handleSubmit = async ()=>{
        try {
            setAddingShow(true)

            // Debug log to help user see what is missing
            console.log('selectedMovie:', selectedMovie, 'dateTimeSelection:', dateTimeSelection, 'showPrice:', showPrice);

            if(!selectedMovie){
                toast.error('Please select a movie.');
                setAddingShow(false);
                return;
            }
            // Robust check: at least one date with at least one time
            const hasAtLeastOneTime = Object.values(dateTimeSelection).some(times => Array.isArray(times) && times.length > 0);
            if(!hasAtLeastOneTime){
                toast.error('Please add at least one date and time.');
                setAddingShow(false);
                return;
            }
            if(!showPrice || isNaN(showPrice) || Number(showPrice) <= 0){
                toast.error('Please enter a valid show price.');
                setAddingShow(false);
                return;
            }

            const showsInput = Object.entries(dateTimeSelection).flatMap(([date, times]) => times.map(time => ({date, time})));

            const payload = {
                movieId: selectedMovie,
                showsInput,
                showPrice: Number(showPrice)
            }

            const { data } = await axios.post('/api/show/add', payload, {headers: { Authorization: `Bearer ${await getToken()}` }})

            if(data.success){
                toast.success(data.message)
                setSelectedMovie(null)
                setDateTimeSelection({})
                setShowPrice("")
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.error("Submission error:", error);
            toast.error('An error occurred. Please try again.')
        }
        setAddingShow(false)
    }

    useEffect(() => {
        if(user){
            fetchNowPlayingMovies();
        }
    }, [user]);

  return nowPlayingMovies.length > 0 ? (
    <>
      <Title text1="Add" text2="Shows" />
      <p className="mt-10 text-lg font-medium">Now Playing Movies</p>
      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
            {nowPlayingMovies.map((movie) =>(
                <div key={movie.id} className={
                  `relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 hover:scale-105 transition duration-300 rounded-lg shadow bg-white/5 border border-primary/20` +
                  (selectedMovie === movie.id ? ' ring-2 ring-primary' : '')
                } onClick={()=> setSelectedMovie(movie.id)}>
                    <div className="relative rounded-lg overflow-hidden">
                        <img src={image_base_url + (movie.poster_path || "")} alt={movie.title || ''} className="w-full object-cover brightness-90 aspect-[2/3]" />
                        <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                                    <p className="flex items-center gap-1 text-gray-400">
                                        <StarIcon className="w-4 h-4 text-primary fill-primary" />
                                        {movie.vote_average?.toFixed(1) ?? 'N/A'}
                                    </p>
                                    <p className="text-gray-300">{kConverter(movie.vote_count || 0)} Votes</p>
                                </div>
                    </div>
                    {selectedMovie === movie.id && (
                        <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded shadow-lg">
                            <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                        </div>
                    )}
                    <p className="font-medium truncate mt-2 text-center">{movie.title}</p>
                    <p className="text-gray-400 text-sm text-center">{movie.release_date}</p>
                </div>
            ))}
        </div>
      </div>

       {/* Show Price Input */}
       <div className="mt-8">
            <label className="block text-sm font-medium mb-2">Show Price</label>
            <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md bg-white/5 focus-within:ring-2 focus-within:ring-primary/40">
                <p className="text-gray-400 text-sm">{currency}</p>
                <input min={0} type="number" value={showPrice} onChange={(e) => setShowPrice(e.target.value)} placeholder="Enter show price" className="outline-none rounded-md px-2 py-1 bg-transparent text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/40" />
            </div>
        </div>

        {/* Date & Time Selection */}
        <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Select Date and Time</label>
            <div className="inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg bg-white/5 focus-within:ring-2 focus-within:ring-primary/40">
                <input type="datetime-local" value={dateTimeInput} onChange={(e) => setDateTimeInput(e.target.value)} className="outline-none rounded-md px-2 py-1 bg-transparent text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/40" />
                <button onClick={handleDateTimeAdd} className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary focus:ring-2 focus:ring-primary/40 transition cursor-pointer disabled:opacity-50" disabled={!dateTimeInput} aria-label="Add Time">
                    Add Time
                </button>
            </div>
        </div>

       {/* Display Selected Times */}
        {Object.keys(dateTimeSelection).length > 0 && (
        <div className="mt-6">
            <h2 className="mb-2 font-semibold">Selected Date-Time</h2>
            <ul className="space-y-3">
                {Object.entries(dateTimeSelection).map(([date, times]) => (
                    <li key={date} className="bg-white/5 rounded-lg p-2">
                        <div className="font-medium">{date}</div>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm">
                            {times.map((time) => (
                                <div key={time} className="border border-primary px-2 py-1 flex items-center rounded bg-primary/10">
                                    <span>{time}</span>
                                    <DeleteIcon onClick={() => handleRemoveTime(date, time)} width={15} className="ml-2 text-red-500 hover:text-red-700 cursor-pointer" aria-label="Remove Time" />
                                </div>
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
            </div>
       )}
       <button onClick={handleSubmit} disabled={addingShow} className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer focus:ring-2 focus:ring-primary/50 disabled:opacity-50 shadow-lg" aria-label="Add Show">
            Add Show
        </button>
    </>
  ) : <Loading />
}

export default AddShows
