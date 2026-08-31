import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../services/api'
import { PlusCircle, Sparkles, CheckCircle2, AlertCircle, Gamepad2, Calendar, Shield, IndianRupee } from 'lucide-react'

export function ContentView() {
  const [competitionType, setCompetitionType] = useState<'tournament' | 'omb'>('tournament')
  const [game, setGame] = useState('BGMI (Battlegrounds Mobile)')
  const [customGameName, setCustomGameName] = useState('')
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState<'Solo' | 'Duo' | 'Squad' | '1v1'>('Solo')
  const [entryFee, setEntryFee] = useState('50')
  const [maxSlots, setMaxSlots] = useState('100')
  const [prizePool, setPrizePool] = useState('3500')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [revealTimeMinutes, setRevealTimeMinutes] = useState('15')
  const [guideVideoUrl, setGuideVideoUrl] = useState('')
  const [managerAlert, setManagerAlert] = useState('')
  const [rulesNotes, setRulesNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // Presets
  function applyPreset(preset: 'bgmi_solo' | 'bgmi_squad' | 'ff_squad' | 'ludo_1v1') {
    if (preset === 'bgmi_solo') {
      setCompetitionType('tournament')
      setGame('BGMI (Battlegrounds Mobile)')
      setTitle('BGMI Erangel Solo Cash Cup')
      setMode('Solo')
      setEntryFee('50')
      setMaxSlots('100')
      setPrizePool('3500')
      setRulesNotes('Emulators strictly prohibited. Room ID shared 15 mins before match.')
    } else if (preset === 'bgmi_squad') {
      setCompetitionType('tournament')
      setGame('BGMI (Battlegrounds Mobile)')
      setTitle('BGMI Squad Championship')
      setMode('Squad')
      setEntryFee('200')
      setMaxSlots('25')
      setPrizePool('3800')
      setRulesNotes('4 Players per squad. Squad leader must join with full team.')
    } else if (preset === 'ff_squad') {
      setCompetitionType('tournament')
      setGame('Free Fire MAX')
      setTitle('Free Fire Bermuda Squad Rush')
      setMode('Squad')
      setEntryFee('120')
      setMaxSlots('48')
      setPrizePool('4500')
      setRulesNotes('No hacks/mods allowed. Screen recording required on dispute.')
    } else if (preset === 'ludo_1v1') {
      setCompetitionType('omb')
      setGame('Ludo King')
      setTitle('Ludo King 1v1 Instant Duel')
      setMode('1v1')
      setEntryFee('25')
      setMaxSlots('2')
      setPrizePool('45')
      setRulesNotes('Classic mode only. Winner must upload winning screenshot.')
    }
  }

  // Automatic Prize Pool calculation helper
  function autoCalculatePrize() {
    const fee = Number(entryFee) || 0
    const slots = Number(maxSlots) || 0
    const totalCollected = fee * slots
    // 80% to prize pool, 20% platform margin
    const calculatedPrize = Math.floor(totalCollected * 0.8)
    setPrizePool(String(calculatedPrize))
  }

  async function handleCreateCompetition(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setActionSuccess('')

    const selectedGame = game === 'Custom' ? customGameName : game
    const payload = {
      type: competitionType,
      game: selectedGame,
      title: title || `${selectedGame} ${mode} Match`,
      mode,
      entryFee: Number(entryFee),
      maxSlots: Number(maxSlots),
      prizePool: Number(prizePool),
      scheduleDate,
      scheduleTime,
      revealTimeMinutes: Number(revealTimeMinutes),
      guideVideoUrl,
      managerAlert,
      rulesNotes,
      status: 'upcoming',
    }

    try {
      await api('/admin/competitions', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setActionSuccess(`Competition "${payload.title}" created and saved to database successfully!`)
      setTitle('')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Server failed to save competition to database.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content-manager-container">
      <div className="page-intro with-action">
        <div>
          <span className="eyebrow">MATCH & TOURNAMENT SCHEDULING</span>
          <h2>Create Competition Content</h2>
          <p>Configure and launch new OMB duels, battle royale tournaments, prize pools, game modes, and custom manager notices.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="alert-card error">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="alert-card success">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Quick Templates Bar */}
      <div className="presets-bar">
        <span className="presets-title">
          <Sparkles size={16} color="#aa3bff" /> Quick Presets:
        </span>
        <button
          type="button"
          className="preset-chip"
          onClick={() => applyPreset('bgmi_solo')}
        >
          BGMI Solo 100 Slots
        </button>
        <button
          type="button"
          className="preset-chip"
          onClick={() => applyPreset('bgmi_squad')}
        >
          BGMI Squad (25 Teams)
        </button>
        <button
          type="button"
          className="preset-chip"
          onClick={() => applyPreset('ff_squad')}
        >
          Free Fire Squad 48 Slots
        </button>
        <button
          type="button"
          className="preset-chip"
          onClick={() => applyPreset('ludo_1v1')}
        >
          Ludo 1v1 Duel
        </button>
      </div>

      <form onSubmit={handleCreateCompetition} className="competition-form-card">
        <div className="form-section-title">
          <Gamepad2 size={18} color="#aa3bff" />
          <span>1. Game & Match Structure</span>
        </div>

        <div className="form-grid-2">
          <label>
            Competition Category
            <select
              value={competitionType}
              onChange={(e) => setCompetitionType(e.target.value as 'tournament' | 'omb')}
            >
              <option value="tournament">Tournament (Multi-player / Bracket)</option>
              <option value="omb">OMB (One Match Battle / 1v1)</option>
            </select>
          </label>

          <label>
            Game Title
            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
            >
              <option value="BGMI (Battlegrounds Mobile)">BGMI (Battlegrounds Mobile)</option>
              <option value="Free Fire MAX">Free Fire MAX</option>
              <option value="Ludo King">Ludo King</option>
              <option value="Call of Duty Mobile">Call of Duty Mobile</option>
              <option value="Custom">Other / Custom Game</option>
            </select>
          </label>
        </div>

        {game === 'Custom' && (
          <label>
            Custom Game Title
            <input
              required
              type="text"
              placeholder="e.g. Clash Royale, WCC3 Cricket"
              value={customGameName}
              onChange={(e) => setCustomGameName(e.target.value)}
            />
          </label>
        )}

        <div className="form-grid-2">
          <label>
            Match Display Title
            <input
              required
              type="text"
              placeholder="e.g. BGMI Daily Midnight Cash Battle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label>
            Team Mode
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'Solo' | 'Duo' | 'Squad' | '1v1')}
            >
              <option value="Solo">Solo (Single Player)</option>
              <option value="Duo">Duo (2 Players/Team)</option>
              <option value="Squad">Squad (4 Players/Team)</option>
              <option value="1v1">1v1 Duel</option>
            </select>
          </label>
        </div>

        <div className="form-section-title">
          <IndianRupee size={18} color="#1bc5bd" />
          <span>2. Financials & Slot Economics</span>
        </div>

        <div className="form-grid-3">
          <label>
            Entry Fee (Play Coins)
            <input
              required
              type="number"
              min="0"
              placeholder="50"
              value={entryFee}
              onChange={(e) => setEntryFee(e.target.value)}
            />
          </label>

          <label>
            Total Slots (Max Players/Teams)
            <input
              required
              type="number"
              min="2"
              placeholder="100"
              value={maxSlots}
              onChange={(e) => setMaxSlots(e.target.value)}
            />
          </label>

          <label>
            Prize Pool (Winning Coins / ₹)
            <div className="input-with-action">
              <input
                required
                type="number"
                min="0"
                placeholder="3500"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
              />
              <button
                type="button"
                className="secondary small-btn"
                onClick={autoCalculatePrize}
                title="Calculate 80% of total entry fees"
              >
                Auto (80%)
              </button>
            </div>
          </label>
        </div>

        <div className="form-section-title">
          <Calendar size={18} color="#3699ff" />
          <span>3. Scheduling & Room Reveal Timing</span>
        </div>

        <div className="form-grid-3">
          <label>
            Match Date
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </label>

          <label>
            Match Time
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </label>

          <label>
            Room ID Reveal (Minutes before match)
            <input
              type="number"
              min="5"
              max="60"
              placeholder="15"
              value={revealTimeMinutes}
              onChange={(e) => setRevealTimeMinutes(e.target.value)}
            />
          </label>
        </div>

        <div className="form-section-title">
          <Shield size={18} color="#ffa800" />
          <span>4. Player Guidelines & Manager Alerts</span>
        </div>

        <div className="form-grid-2">
          <label>
            Manager Notice / Alert Banner (Optional)
            <input
              type="text"
              placeholder="e.g. ⚠️ Emulators are not allowed. Mobile players only."
              value={managerAlert}
              onChange={(e) => setManagerAlert(e.target.value)}
            />
          </label>

          <label>
            Guide Video URL / Stream Link (Optional)
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={guideVideoUrl}
              onChange={(e) => setGuideVideoUrl(e.target.value)}
            />
          </label>
        </div>

        <label>
          Match Rules & Terms
          <textarea
            rows={3}
            placeholder="Enter rules, dispute instructions, and prize distribution conditions..."
            value={rulesNotes}
            onChange={(e) => setRulesNotes(e.target.value)}
          />
        </label>

        <div className="form-submit-row">
          <button type="submit" className="primary full" disabled={loading}>
            <PlusCircle size={18} />
            {loading ? 'Publishing Competition...' : 'Create & Schedule Competition'}
          </button>
        </div>
      </form>
    </div>
  )
}
