'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Upload, X, FileSpreadsheet, AlertTriangle, CheckCircle2,
  Loader2, ArrowRight, Trash2, Info
} from 'lucide-react'
import Papa from 'papaparse'
import { generatePreview, type ParsePreview } from '@/lib/vortex-parser'
import { importCSVData, type ImportProgress, type ImportResult } from '@/lib/csv-importer'

interface Props {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
  existingCount: number
}

type Phase = 'upload' | 'preview' | 'importing' | 'done' | 'error'

export default function CSVUploadModal({ isOpen, onClose, onImportComplete, existingCount }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [preview, setPreview] = useState<ParsePreview | null>(null)
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append')
  const [confirmDelete, setConfirmDelete] = useState('')
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const reset = () => {
    setPhase('upload')
    setFile(null)
    setCsvRows([])
    setPreview(null)
    setImportMode('append')
    setConfirmDelete('')
    setProgress(null)
    setResult(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      return
    }

    setFile(selectedFile)

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[]
        setCsvRows(rows)
        const previewData = generatePreview(rows)
        setPreview(previewData)
        setPhase('preview')
      },
      error: () => {
        setPhase('error')
      },
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFile(droppedFile)
  }, [handleFile])

  const handleImport = async () => {
    if (importMode === 'replace' && confirmDelete !== 'DELETE') return

    setPhase('importing')

    const importResult = await importCSVData(csvRows, importMode, (p) => {
      setProgress({ ...p })
    })

    setResult(importResult)
    setPhase('done')
  }

  if (!isOpen) return null

  const formatNumber = (n: number) => n.toLocaleString()
  const formatPrice = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
    return `$${n}`
  }

  // Sort cities by count
  const topCities = preview
    ? Object.entries(preview.cities)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-navy-800 border border-white/20 rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-norv/20 flex items-center justify-center">
              <Upload size={20} className="text-norv" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Import Leads from CSV</h2>
              <p className="text-sm text-white/50">Vortex / REDX format</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Phase: Upload */}
          {phase === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                dragActive 
                  ? 'border-norv bg-norv/10' 
                  : 'border-white/20 hover:border-white/40 hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet size={48} className="mx-auto text-white/30 mb-4" />
              <p className="text-white font-medium mb-1">Drop CSV file here</p>
              <p className="text-white/50 text-sm mb-4">or click to browse</p>
              <p className="text-white/30 text-xs">Accepts: Vortex/REDX .csv files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
                className="hidden"
              />
            </div>
          )}

          {/* Phase: Preview */}
          {phase === 'preview' && preview && (
            <div className="space-y-4">
              {/* File Info */}
              <div className="bg-navy-900 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileSpreadsheet size={16} className="text-norv" />
                  <span className="text-white font-medium">{file?.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">{formatNumber(preview.totalRows)}</div>
                    <div className="text-white/50">Properties</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">{formatNumber(preview.totalContacts)}</div>
                    <div className="text-white/50">Contacts</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-2xl font-bold text-emerald-400">{formatNumber(preview.callablePhones)}</div>
                    <div className="text-white/50">Callable Phones</div>
                    {preview.dncPhones > 0 && (
                      <div className="text-xs text-red-400 mt-1">{formatNumber(preview.dncPhones)} DNC</div>
                    )}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-2xl font-bold text-amber-400">{formatNumber(preview.totalEmails)}</div>
                    <div className="text-white/50">Emails</div>
                  </div>
                </div>
              </div>

              {/* Cities */}
              {topCities.length > 0 && (
                <div className="bg-navy-900 rounded-xl p-4">
                  <div className="text-sm text-white/60 mb-2">Top Cities</div>
                  <div className="flex flex-wrap gap-2">
                    {topCities.map(([city, count]) => (
                      <span key={city} className="px-2 py-1 bg-white/10 rounded-lg text-xs text-white">
                        {city} <span className="text-white/50">({count})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              {preview.priceRange.max > 0 && (
                <div className="bg-navy-900 rounded-xl p-4 text-sm">
                  <span className="text-white/60">Price Range: </span>
                  <span className="text-white">{formatPrice(preview.priceRange.min)} — {formatPrice(preview.priceRange.max)}</span>
                </div>
              )}

              {/* Import Mode */}
              <div className="bg-navy-900 rounded-xl p-4">
                <div className="text-sm text-white/60 mb-3">Import Mode</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="w-4 h-4 text-norv bg-navy-800 border-white/30 focus:ring-norv"
                    />
                    <div>
                      <div className="text-white font-medium text-sm">Append to existing leads</div>
                      <div className="text-white/50 text-xs">Duplicates (by Vortex ID) will be skipped</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="w-4 h-4 text-red-500 bg-navy-800 border-white/30 focus:ring-red-500"
                    />
                    <div>
                      <div className="text-white font-medium text-sm">Replace all (clear &amp; import)</div>
                      <div className="text-white/50 text-xs">Deletes everything first, then imports fresh</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Replace Warning */}
              {importMode === 'replace' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-400 font-medium text-sm">
                        This will delete {existingCount} existing properties and all related data.
                      </p>
                      <p className="text-white/50 text-xs mt-2 mb-3">
                        Type <strong className="text-red-400">DELETE</strong> to confirm:
                      </p>
                      <input
                        type="text"
                        value={confirmDelete}
                        onChange={(e) => setConfirmDelete(e.target.value)}
                        placeholder="Type DELETE"
                        className="w-full bg-navy-900 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={reset}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importMode === 'replace' && confirmDelete !== 'DELETE'}
                  className="px-6 py-2 rounded-lg bg-norv hover:bg-norv/80 text-white font-medium transition text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Import {formatNumber(preview.totalRows)} Leads
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Phase: Importing */}
          {phase === 'importing' && progress && (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 size={40} className="mx-auto text-norv animate-spin mb-4" />
                <p className="text-white font-medium">
                  {progress.phase === 'checking' && 'Checking for duplicates...'}
                  {progress.phase === 'clearing' && 'Clearing existing data...'}
                  {progress.phase === 'importing' && 'Importing leads...'}
                </p>
              </div>

              {/* Progress Bar */}
              {progress.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm text-white/60 mb-2">
                    <span>{formatNumber(progress.current)} / {formatNumber(progress.total)}</span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-norv h-full rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Live Stats */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-navy-900 rounded-lg p-3">
                  <div className="text-white font-medium">{formatNumber(progress.propertiesImported)}</div>
                  <div className="text-white/50 text-xs">Properties</div>
                </div>
                <div className="bg-navy-900 rounded-lg p-3">
                  <div className="text-white font-medium">{formatNumber(progress.contactsCreated)}</div>
                  <div className="text-white/50 text-xs">Contacts</div>
                </div>
                <div className="bg-navy-900 rounded-lg p-3">
                  <div className="text-white font-medium">{formatNumber(progress.phonesCreated)}</div>
                  <div className="text-white/50 text-xs">Phones</div>
                </div>
                <div className="bg-navy-900 rounded-lg p-3">
                  <div className="text-white font-medium">{formatNumber(progress.emailsCreated)}</div>
                  <div className="text-white/50 text-xs">Emails</div>
                </div>
              </div>
            </div>
          )}

          {/* Phase: Done */}
          {phase === 'done' && result && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  result.errors > 0 ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                }`}>
                  <CheckCircle2 size={32} className={result.errors > 0 ? 'text-amber-400' : 'text-emerald-400'} />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {result.errors > 0 ? 'Import Completed with Warnings' : 'Import Complete'}
                </h3>
              </div>

              <div className="bg-navy-900 rounded-xl p-4 space-y-3">
                <ResultRow label="Properties" value={formatNumber(result.propertiesImported)} color="text-white" />
                <ResultRow label="Contacts" value={formatNumber(result.contactsCreated)} color="text-white" />
                <ResultRow
                  label="Phones"
                  value={`${formatNumber(result.phonesCreated)} (${formatNumber(result.callablePhones)} callable, ${formatNumber(result.dncPhones)} DNC)`}
                  color="text-emerald-400"
                />
                <ResultRow label="Emails" value={formatNumber(result.emailsCreated)} color="text-amber-400" />
                {result.duplicatesSkipped > 0 && (
                  <ResultRow label="Duplicates skipped" value={formatNumber(result.duplicatesSkipped)} color="text-white/50" />
                )}
                {result.errors > 0 && (
                  <ResultRow label="Errors" value={formatNumber(result.errors)} color="text-red-400" />
                )}
              </div>

              {result.errorMessages.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm">
                  <div className="text-red-400 font-medium mb-2">Error Details:</div>
                  {result.errorMessages.slice(0, 5).map((msg, i) => (
                    <p key={i} className="text-red-300/70 text-xs">{msg}</p>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onImportComplete()
                    handleClose()
                  }}
                  className="px-6 py-2 rounded-lg bg-norv hover:bg-norv/80 text-white font-medium transition text-sm flex items-center gap-2"
                >
                  View Leads
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Phase: Error */}
          {phase === 'error' && (
            <div className="text-center py-8">
              <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
              <p className="text-white font-medium mb-2">Failed to parse CSV</p>
              <p className="text-white/50 text-sm mb-4">Please check the file format and try again.</p>
              <button
                onClick={reset}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition text-sm"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/60 text-sm">{label}</span>
      <span className={`font-medium text-sm ${color}`}>{value}</span>
    </div>
  )
}
