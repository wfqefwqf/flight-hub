import { useState } from 'react';
import type { CabinAnnouncement, FlightHubSnapshot } from '@shared/types';
import { GlassCard } from '../components/ui/GlassCard';

export function CabinPage({ snapshot }: { snapshot: FlightHubSnapshot }) {
  const [message, setMessage] = useState<string>('');

  const play = async (announcement: CabinAnnouncement) => {
    try {
      const result = await window.flightHub.playAnnouncement(announcement);
      setMessage(result.message + (result.mediaDirectory ? ` Media dir: ${result.mediaDirectory}` : ''));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '播放失败');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">客舱语音</h1>
        <p className="mt-2 text-sm text-slate-400">当前仅展示真实可用功能：本地 WAV/MP3 媒体播放。请先把媒体文件放入运行时媒体目录，再点击播放。</p>
        {message ? <p className="mt-3 text-xs text-sky-300">{message}</p> : null}
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        {snapshot.announcements.map((announcement) => (
          <GlassCard key={announcement.id} title={announcement.title} extra={<span className="text-xs text-slate-400">{announcement.phase}</span>}>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl bg-white/5 p-4">{announcement.text}</div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                <span>语言：{announcement.language}</span>
                <span>模式：{announcement.mode}</span>
                <span>自动播放：{announcement.autoPlay ? '已启用' : '未启用'}</span>
                {announcement.mediaFile ? <span>媒体：{announcement.mediaFile}</span> : null}
              </div>
              <button className="rounded-2xl bg-sky-400/20 px-4 py-3 text-sm text-sky-200" onClick={() => play(announcement)}>{announcement.mode === 'wav' ? '播放媒体文件' : 'TTS 未接入'}</button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
