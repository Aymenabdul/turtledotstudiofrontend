import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  QrCode, 
  Plus, 
  Download, 
  Printer, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  X,
  Copy,
  Check,
  Sparkles,
  Trash2
} from 'lucide-react';
import api from '../../api/axios';
import { useAlert } from '../../context/AlertContext';
import { CustomSelect } from '../../components/CustomSelect';

export const QrCodes = () => {
  const queryClient = useQueryClient();
  const alert = useAlert();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [copiedToken, setCopiedToken] = useState('');

  // Fetch QR codes list
  const { data: qrData, isLoading } = useQuery({
    queryKey: ['qr-list'],
    queryFn: async () => {
      const res = await api.get('/qr/list');
      return res.data.data.content || [];
    },
  });

  // Fetch events for generator modal
  const { data: eventsList } = useQuery({
    queryKey: ['events-for-qr'],
    queryFn: async () => {
      const res = await api.get('/events', { params: { size: 100 } });
      return res.data.data.content || [];
    },
  });

  // Mutations
  const generateMutation = useMutation({
    mutationFn: (eventId) => api.post('/qr/generate', null, { params: { eventId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-list'] });
      setModalOpen(false);
      setSelectedEventId('');
      alert.success('New QR Gallery access token generated!', 'QR Created');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to generate QR token.', 'Error');
    }
  });

  const regenerateMutation = useMutation({
    mutationFn: (id) => api.post(`/qr/${id}/regenerate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-list'] });
      alert.success('QR gallery access token has been regenerated.', 'Token Regenerated');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to regenerate token.', 'Error');
    }
  });

  const disableMutation = useMutation({
    mutationFn: (id) => api.patch(`/qr/${id}/disable`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-list'] });
      alert.info('QR gallery token has been deactivated.', 'Token Disabled');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/qr/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-list'] });
      alert.success('QR gallery token has been permanently deleted.', 'QR Deleted');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to delete QR token.', 'Error');
    }
  });

  const handleCopy = (url, token) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(''), 2500);
  };

  const handlePrintGuestStandee = (qrId, eventName) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${eventName} — Guest Candid QR Standee</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; text-align: center; padding: 40px; background: #fffdf9; color: #1c1917; margin: 0; }
            .standee { border: 2px solid #e7e5e4; border-radius: 24px; padding: 40px 32px; max-width: 420px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 25px rgba(217,119,6,0.08); position: relative; overflow: hidden; }
            .standee::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 8px; background: linear-gradient(90deg, #d97706, #f59e0b, #b45309); }
            .badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #fde68a; }
            h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #1c1917; }
            h2 { margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #78716c; }
            p.desc { margin: 0 auto 20px; font-size: 13px; color: #57534e; line-height: 1.5; max-width: 320px; }
            .qr-wrapper { background: #fafaf9; border: 2px dashed #d6d3d1; border-radius: 20px; padding: 18px; display: inline-block; margin-bottom: 20px; }
            img { display: block; width: 240px; height: 240px; border-radius: 12px; }
            .steps { text-align: left; background: #fefce8; border: 1px solid #fef08a; border-radius: 14px; padding: 14px 18px; margin: 0 auto 20px; max-width: 320px; }
            .step-item { font-size: 12px; color: #713f12; margin: 4px 0; font-weight: 600; }
            .footer { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #a8a29e; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="standee">
            <span class="badge">📸 Guest Candid Store</span>
            <h1>Find Your Candid Photos!</h1>
            <h2>${eventName}</h2>
            <p class="desc">We captured your special moments today. Scan the QR code with your mobile camera to view and instantly download your photos.</p>
            <div class="qr-wrapper">
              <img src="/api/qr/${qrId}/image?type=guest&size=600" alt="Guest Standee QR Code" />
            </div>
            <div class="steps">
              <div class="step-item">📱 1. Scan QR with your phone camera</div>
              <div class="step-item">👀 2. Find your candid memories</div>
              <div class="step-item">⚡ 3. Instant unwatermarked HD download</div>
            </div>
            <div class="footer">Turtledot Studio • Instant Venue Delivery</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrint = (qrId, eventName, clientName) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${eventName} — QR Gallery Card</title>
          <style>
            body { font-family: 'Helvetica Neue', sans-serif; text-align: center; padding: 40px; background: #faf8f5; color: #1c1917; }
            .card { border: 1.5px solid #d6d3d1; border-radius: 16px; padding: 32px; max-width: 400px; margin: 0 auto; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            h2 { margin: 0 0 8px; font-size: 22px; color: #1c1917; }
            p { margin: 4px 0; font-size: 14px; color: #57534e; }
            img { margin: 24px auto; display: block; width: 260px; height: 260px; border-radius: 8px; }
            .footer { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a8a29e; margin-top: 20px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${eventName}</h2>
            <p>Exclusive Client Photo Gallery</p>
            <p><strong>${clientName}</strong></p>
            <img src="/api/qr/${qrId}/image?type=host&size=500" alt="QR Code" />
            <p>Scan with your mobile camera to view and download your memories.</p>
            <div class="footer">Turtledot Studio Gallery</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 sm:space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight drop-shadow-xs">QR Codes & Client Gallery Tokens</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Generate printable QR access cards for wedding couples, clients, and event guests.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="neu-glass-btn-primary px-5 py-2.5 text-white font-bold text-xs rounded-2xl shadow-md flex items-center space-x-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Generate QR for Event</span>
        </button>
      </div>

      {/* QR Codes Table */}
      <div className="neu-glass-panel rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/60 border-b border-stone-200/60 text-stone-600">
              <tr>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-stone-600">QR Preview</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-stone-600">Event & Client</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-stone-600">Gallery Access Link</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-stone-600">Status</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-stone-600">Last Accessed</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-stone-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60 text-stone-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-stone-400">
                    <span className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin inline-block"></span>
                  </td>
                </tr>
              ) : qrData?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-stone-400">
                    <QrCode className="w-10 h-10 mx-auto text-stone-300 mb-3" />
                    <p className="font-bold text-stone-700 text-sm">No QR tokens generated yet</p>
                    <p className="text-xs text-stone-400 mt-1">Generate a QR code for your booked events.</p>
                  </td>
                </tr>
              ) : (
                qrData?.map((qr) => {
                  const guestUrl = qr.guestGalleryUrl || `${qr.galleryUrl}/guest`;
                  const hasCommercial = Boolean(qr.hasCommercialAlbums);

                  return (
                    <tr key={qr.id} className="hover:bg-amber-50/40 transition">
                      <td className="px-5 py-4">
                        <div className={`w-14 h-14 rounded-2xl bg-white p-1.5 shadow-sm border flex items-center justify-center relative ${
                          hasCommercial ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-stone-200'
                        }`}>
                          <img
                            src={`/api/qr/${qr.id}/image?type=${hasCommercial ? 'guest' : 'host'}&size=150`}
                            alt="QR Code"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-stone-900 text-xs sm:text-sm">{qr.eventName}</h4>
                          {hasCommercial && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                              Guest
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 font-medium mt-0.5">Client: {qr.clientName}</p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs text-amber-900 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/80 max-w-[200px] truncate">
                            {qr.galleryUrl}
                          </span>
                          <button
                            onClick={() => handleCopy(qr.galleryUrl, qr.tokenValue)}
                            className="neu-glass-btn p-1.5 text-stone-400 hover:text-stone-800 transition cursor-pointer"
                            title="Copy Link"
                          >
                            {copiedToken === qr.tokenValue ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                          qr.status === 'ACTIVE'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                          {qr.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-stone-500 text-xs font-medium">
                        {qr.lastUsedAt ? new Date(qr.lastUsedAt).toLocaleDateString() : 'Never used'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <a
                            href={qr.galleryUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Open Live Gallery"
                            className="neu-glass-btn p-2 rounded-xl text-stone-700 hover:text-stone-900 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <a
                            href={`/api/qr/${qr.id}/image?type=${hasCommercial ? 'guest' : 'host'}&size=800`}
                            download={`gallery_qr_${qr.tokenValue}.png`}
                            title="Download High-Res PNG"
                            className="neu-glass-btn p-2 rounded-xl text-amber-800 hover:text-amber-950 transition"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-700" />
                          </a>

                          <button
                            onClick={() => hasCommercial ? handlePrintGuestStandee(qr.id, qr.eventName) : handlePrint(qr.id, qr.eventName, qr.clientName)}
                            title={hasCommercial ? "Print Venue Table Standee" : "Print Presentation Card"}
                            className="neu-glass-btn p-2 rounded-xl text-sky-800 hover:text-sky-950 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-sky-700" />
                          </button>

                          <button
                            onClick={() => {
                              alert.confirm({
                                title: 'Regenerate QR Token',
                                message: 'Regenerate this QR token? The old token will be permanently disabled immediately.',
                                confirmText: 'Regenerate Token',
                                variant: 'warning',
                                onConfirm: () => regenerateMutation.mutate(qr.id),
                              });
                            }}
                            title="Regenerate Token"
                            className="neu-glass-btn p-2 rounded-xl text-stone-500 hover:text-stone-800 transition cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              alert.confirm({
                                title: 'Delete QR Code',
                                message: 'Are you sure you want to delete this QR code? Clients and guests will no longer be able to access the gallery.',
                                confirmText: 'Delete QR Code',
                                variant: 'danger',
                                onConfirm: () => deleteMutation.mutate(qr.id),
                              });
                            }}
                            title="Delete QR Code"
                            className="neu-glass-btn p-2 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md">
          <div className="neu-glass-panel max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150 border border-white/60">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                  <QrCode className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base">Generate QR Gallery</h3>
                  <p className="text-xs text-stone-500">Create access token for event gallery</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="neu-glass-btn p-2 text-stone-400 hover:text-stone-700 rounded-xl transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedEventId) {
                  alert.warning('Please select an event to generate a QR token.', 'Event Required');
                  return;
                }
                generateMutation.mutate(selectedEventId);
              }}
              className="space-y-4 mt-4 text-xs"
            >
              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Select Event *</label>
                <CustomSelect
                  value={selectedEventId}
                  onChange={(val) => setSelectedEventId(val)}
                  placeholder="-- Choose Event --"
                  options={eventsList?.map((ev) => ({
                    value: ev.id,
                    label: ev.eventName,
                    subtext: ev.clientName,
                  })) || []}
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-200/60">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="neu-glass-btn px-4 py-2.5 text-stone-700 rounded-2xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedEventId || generateMutation.isPending}
                  className="neu-glass-btn-primary px-5 py-2.5 text-white font-bold rounded-2xl disabled:opacity-50 shadow-md transition cursor-pointer"
                >
                  {generateMutation.isPending ? 'Generating...' : 'Generate QR Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QrCodes;
