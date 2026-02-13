import React, { useState } from 'react';
import { Calendar, Sparkles, Heart, RotateCcw, Check } from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [historicalEvent, setHistoricalEvent] = useState(null);
  const [usedDates, setUsedDates] = useState([]);
  const [isFinalized, setIsFinalized] = useState(false);
  const [randomDates, setRandomDates] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() + 1);
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([
    'Bilim ve Teknoloji',
    'Sanat ve Kültür',
    'Spor',
    'Siyaset ve Tarih',
    'Müzik ve Eğlence',
    'Keşif ve Macera',
    'Barış ve İnsanlık',
  ]);

  const categories = [
    { id: 'science', label: 'Bilim ve Teknoloji', icon: '🔬' },
    { id: 'art', label: 'Sanat ve Kültür', icon: '🎨' },
    { id: 'sports', label: 'Spor', icon: '⚽' },
    { id: 'politics', label: 'Siyaset ve Tarih', icon: '🏛️' },
    { id: 'music', label: 'Müzik ve Eğlence', icon: '🎵' },
    { id: 'exploration', label: 'Keşif ve Macera', icon: '🚀' },
    { id: 'peace', label: 'Barış ve İnsanlık', icon: '🕊️' },
  ];

  const toggleCategory = (categoryLabel) => {
    if (selectedCategories.includes(categoryLabel)) {
      setSelectedCategories(selectedCategories.filter(c => c !== categoryLabel));
    } else {
      setSelectedCategories([...selectedCategories, categoryLabel]);
    }
  };

  // Get weekend dates only in the selected year
  const getWeekendDates = () => {
    const dates = [];
    const startDate = new Date(selectedYear, 0, 1); // January 1 of selected year
    const endDate = new Date(selectedYear, 11, 31); // December 31 of selected year
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      weekday: 'long'
    });
  };

  const handleGetDate = async () => {
    if (selectedCategories.length === 0) {
      alert('Lütfen en az bir olay kategorisi seçin!');
      return;
    }
    
    setIsLoading(true);
    setIsFinalized(false);
    
    // Get all weekend dates
    const weekendDates = getWeekendDates();
    
    // Filter out already used dates
    const availableDates = weekendDates.filter(date => 
      !usedDates.some(used => used.getTime() === date.getTime())
    );
    
    if (availableDates.length === 0) {
      alert('Tüm tarihler kullanıldı! Lütfen "Seçtiğim tarihleri unut" butonuna basın.');
      setIsLoading(false);
      return;
    }
    
    // Initialize with first random date
    const initialRandomIndex = Math.floor(Math.random() * availableDates.length);
    setRandomDates([availableDates[initialRandomIndex]]);
    
    // Show random dates animation
    const animationInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * availableDates.length);
      setRandomDates([availableDates[randomIndex]]);
    }, 100);
    
    // Wait for animation (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));
    clearInterval(animationInterval);
    
    try {
      // Call Groq API to select date and find historical event
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!groqApiKey) {
        throw new Error('Groq API Key bulunamadı. Lütfen .env dosyasında VITE_GROQ_API_KEY ayarlayınız.');
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [{
            role: 'user',
            content: `Sen bir düğün tarihi danışmanısın. Aşağıdaki tarihlerden birini seç ve o tarihin gün-ay kombinasyonunda (yıl önemli değil) geçmişte yaşanmış mutlu, olumlu bir tarihi olayı bul. Tarihi olaylar gerçek olmalı.

İzin verilen olay kategorileri: ${selectedCategories.join(', ')}

SADECE bu kategorilerden birine ait olaylar seç. Eğer kullanıcı sporu hariç tuttuysa, spor olayı seçme.

Mevcut tarihler:
${availableDates.slice(0, 10).map((d, i) => `${i + 1}. ${formatDate(d)}`).join('\n')}

SADECE şu JSON formatında cevap ver:
{
  "selectedIndex": <seçilen tarihin indexi 0-9 arası>,
  "event": "<o gün-ay'da geçmişte yaşanmış mutlu olay (Türkçe)>",
  "year": <olayın gerçekleştiği yıl>,
  "category": "<olayın kategorisi>"
}`
          }],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';
      
      // Parse JSON response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        const chosenDate = availableDates[result.selectedIndex % availableDates.length];
        
        setSelectedDate(chosenDate);
        setHistoricalEvent({
          description: result.event,
          year: result.year,
          category: result.category || null
        });
        setUsedDates([...usedDates, chosenDate]);
      }
    } catch (error) {
      console.error('Error:', error);
      // Fallback: pick random date
      const randomIndex = Math.floor(Math.random() * availableDates.length);
      const chosenDate = availableDates[randomIndex];
      setSelectedDate(chosenDate);
      setHistoricalEvent({
        description: 'Bu tarihin güzel bir geleceği var!',
        year: new Date().getFullYear()
      });
      setUsedDates([...usedDates, chosenDate]);
    }
    
    setRandomDates([]);
    setIsLoading(false);
  };

  const handleForgetDates = () => {
    setUsedDates([]);
    setSelectedDate(null);
    setHistoricalEvent(null);
    setIsFinalized(false);
  };

  const handleFinalize = () => {
    setIsFinalized(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-rose-100 to-pink-300 p-4 sm:p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-rose-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-48 sm:w-72 h-48 sm:h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-48 sm:w-72 h-48 sm:h-72 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Loading Animation - Centered on screen with blur background */}
      {isLoading && (
        <>
          <div className="fixed inset-0 bg-pink-100/30 backdrop-blur-xl z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="text-center bg-white/20 backdrop-blur-lg rounded-3xl p-6 sm:p-12 border border-white/30 shadow-2xl max-w-full">
              {randomDates.length > 0 && (
                <div className="text-2xl sm:text-4xl md:text-6xl font-bold text-black animate-pulse px-2 sm:px-4 leading-tight">
                  {formatDate(randomDates[0])}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      <div className={`max-w-2xl mx-auto relative ${isLoading ? 'blur-sm' : ''} z-10`}>
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-rose-500 drop-shadow-lg" fill="currentColor" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black drop-shadow-md">Düğün Tarihi Bulucu</h1>
            <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-rose-500 drop-shadow-lg" fill="currentColor" />
          </div>
          <p className="text-black text-base sm:text-lg font-medium px-4">Yapay zeka destekli, tarihi anlamlı düğün tarihi seçimi</p>
        </div>

        {/* Main Content - Glass Card */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl p-4 sm:p-8 mb-4 sm:mb-6 border border-white/50">
          {/* Selected Date Display */}
          {!isLoading && selectedDate && (
            <div className="text-center">
              <div className="mb-4 sm:mb-6">
                <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-rose-500 drop-shadow-lg" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-2 drop-shadow-sm px-2">
                  {formatDate(selectedDate)}
                </h2>
              </div>

              {historicalEvent && (
                <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-white/60 shadow-lg">
                  <h3 className="text-base sm:text-lg font-semibold text-black mb-2 sm:mb-3">
                    📜 Bu Tarihte Yaşanan Tarihi Olay:
                  </h3>
                  <p className="text-black text-base sm:text-lg leading-relaxed font-medium">
                    {historicalEvent.description}
                  </p>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mt-2 sm:mt-3 flex-wrap">
                    <p className="text-xs sm:text-sm text-gray-800 font-medium">
                      ({historicalEvent.year})
                    </p>
                    {historicalEvent.category && (
                      <span className="text-xs bg-rose-500/20 text-rose-700 px-2 sm:px-3 py-1 rounded-full font-semibold border border-rose-300">
                        {historicalEvent.category}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {isFinalized && (
                <div className="bg-green-400/30 backdrop-blur-md border-2 border-green-400/50 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-xl">
                  <Check className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-green-700 drop-shadow-lg" />
                  <h3 className="text-xl sm:text-2xl font-bold text-green-900 mb-2 drop-shadow-sm">
                    🎉 Tarihiniz Onaylandı!
                  </h3>
                  <p className="text-black leading-relaxed font-medium text-sm sm:text-base md:text-lg px-2">
                    Evlenmek için seçtiğiniz tarih: <strong>{formatDate(selectedDate)}</strong>
                    <br />
                    <span className="text-xs sm:text-sm text-gray-800 mt-2 block">
                      "{historicalEvent?.description}" ({historicalEvent?.year})
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Initial State */}
          {!isLoading && !selectedDate && (
            <div className="text-center py-8 sm:py-12">
              <Heart className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 text-rose-400 drop-shadow-xl animate-pulse" fill="currentColor" />
              <p className="text-black text-lg sm:text-xl font-medium mb-6 sm:mb-8 px-4">
                Özel gününüz için mükemmel tarihi bulmaya hazır mısınız?
              </p>
              
              {/* Category Selection */}
              <div className="max-w-md mx-auto mb-6 sm:mb-8 px-2">
                <button
                  onClick={() => setShowCategories(!showCategories)}
                  className="w-full bg-white/60 backdrop-blur-md border-2 border-white/60 rounded-xl px-4 py-3 text-black font-semibold text-base sm:text-lg shadow-lg hover:bg-white/70 transition-all flex items-center justify-between"
                >
                  <span className="text-sm sm:text-base">🎯 Olay Kategorilerini Seç</span>
                  <span className="text-xs sm:text-sm bg-rose-500 text-white px-2 sm:px-3 py-1 rounded-full">
                    {selectedCategories.length}/{categories.length}
                  </span>
                </button>
                
                {showCategories && (
                  <div className="mt-4 bg-white/60 backdrop-blur-md border-2 border-white/60 rounded-xl p-3 sm:p-4 shadow-lg">
                    <p className="text-xs sm:text-sm text-gray-700 mb-3 text-left">
                      Tarihinizde hangi kategorilerdeki olayları görmek istersiniz?
                    </p>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-white/50 cursor-pointer transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.label)}
                            onChange={() => toggleCategory(category.label)}
                            className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-rose-400 text-rose-500 focus:ring-2 focus:ring-rose-400"
                          />
                          <span className="text-xl sm:text-2xl">{category.icon}</span>
                          <span className="text-black font-medium flex-1 text-left text-sm sm:text-base">
                            {category.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    {selectedCategories.length === 0 && (
                      <p className="text-red-600 text-xs sm:text-sm mt-3 font-semibold">
                        ⚠️ En az bir kategori seçmelisiniz
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Year Selector */}
              <div className="max-w-xs mx-auto px-2">
                <label className="block text-black font-semibold mb-3 text-base sm:text-lg">
                  Hangi yıla kadar tarih aramak istersiniz?
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-white/60 backdrop-blur-md border-2 border-white/60 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-black font-semibold text-base sm:text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                >
                  {Array.from({ length: 21 }, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs sm:text-sm text-gray-700 mt-2 sm:mt-3">
                  {new Date(selectedYear, 0, 1).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} - {new Date(selectedYear, 11, 31).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} arası
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 sm:space-y-4 px-2">
          <button
            onClick={handleGetDate}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-rose-500/80 to-pink-500/80 backdrop-blur-lg hover:from-rose-600/90 hover:to-pink-600/90 text-white font-bold text-base sm:text-lg py-4 sm:py-5 px-4 sm:px-6 rounded-2xl shadow-2xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 sm:gap-3 border border-white/30"
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="leading-tight">Evlenmek İçin Tarih Alın</span>
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {selectedDate && !isFinalized && (
            <button
              onClick={handleFinalize}
              className="w-full bg-green-500/80 backdrop-blur-lg hover:bg-green-600/90 text-white font-bold text-base sm:text-lg py-4 sm:py-5 px-4 sm:px-6 rounded-2xl shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 border border-white/30"
            >
              <Check className="w-5 h-5 sm:w-6 sm:h-6" />
              Tarihi Onayla
            </button>
          )}

          {usedDates.length > 0 && (
            <button
              onClick={handleForgetDates}
              className="w-full bg-white/50 backdrop-blur-lg hover:bg-white/70 text-black font-semibold text-sm sm:text-base py-3 sm:py-4 px-4 sm:px-6 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/60 shadow-lg"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Seçtiğim Tarihleri Unut ({usedDates.length})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
