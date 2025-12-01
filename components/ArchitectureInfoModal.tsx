
import React from 'react';
import { X, Database, CircuitBoard, CheckCircle2 } from 'lucide-react';
import { ClusterMode } from '../types';

interface ArchitectureInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: ClusterMode;
}

export const ArchitectureInfoModal: React.FC<ArchitectureInfoModalProps> = ({ isOpen, onClose, activeMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-kafka-dark border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Kiến trúc Kafka Cluster</h2>
            <p className="text-gray-400 text-sm mt-1">So sánh cơ chế quản lý Metadata: Legacy vs Modern</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Zookeeper Column */}
          <div className={`rounded-xl border p-5 transition-all ${activeMode === 'ZOOKEEPER' ? 'bg-blue-900/10 border-blue-500/50 ring-1 ring-blue-500/30' : 'bg-gray-900/30 border-gray-800 opacity-70 hover:opacity-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-900/30 rounded-lg border border-blue-500/30">
                <Database className="text-blue-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-blue-100">ZooKeeper (Legacy)</h3>
              {activeMode === 'ZOOKEEPER' && <span className="ml-auto text-[10px] bg-blue-500 text-black font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
            </div>

            <p className="text-sm text-gray-300 mb-4 italic border-l-2 border-blue-500/30 pl-3">
              Thành phần bên ngoài, tách biệt và cực kỳ quan trọng trong các cụm Kafka truyền thống.
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-blue-300 font-semibold text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Quản lý Cấu hình & Metadata
                </h4>
                <ul className="list-disc list-inside text-xs text-gray-400 pl-5 space-y-1">
                  <li>Lưu trữ danh sách Broker đang hoạt động.</li>
                  <li>Lưu trữ cấu hình Topic (Partitions, Replication Factor...).</li>
                  <li>Lưu trữ quyền truy cập (ACLs).</li>
                </ul>
              </div>

              <div>
                <h4 className="text-blue-300 font-semibold text-sm mb-1 flex items-center gap-2">
                   <CheckCircle2 size={14} /> Bầu chọn Controller
                </h4>
                <p className="text-xs text-gray-400 pl-5 leading-relaxed">
                  Bầu ra một Broker làm <b>Controller</b> để quản lý nhiệm vụ cấp cụm (tạo topic, xử lý failover).
                </p>
              </div>

              <div>
                <h4 className="text-blue-300 font-semibold text-sm mb-1 flex items-center gap-2">
                   <CheckCircle2 size={14} /> Service Discovery
                </h4>
                <p className="text-xs text-gray-400 pl-5 leading-relaxed">
                  Broker đăng ký với ZK để Producer/Consumer biết ai đang sống.
                </p>
              </div>
            </div>
          </div>

          {/* KRaft Column */}
          <div className={`rounded-xl border p-5 transition-all ${activeMode === 'KRAFT' ? 'bg-purple-900/10 border-purple-500/50 ring-1 ring-purple-500/30' : 'bg-gray-900/30 border-gray-800 opacity-70 hover:opacity-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-900/30 rounded-lg border border-purple-500/30">
                <CircuitBoard className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-purple-100">KRaft (Modern)</h3>
              {activeMode === 'KRAFT' && <span className="ml-auto text-[10px] bg-purple-500 text-black font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
            </div>

             <p className="text-sm text-gray-300 mb-4 italic border-l-2 border-purple-500/30 pl-3">
              Kafka Raft Metadata Mode. Loại bỏ sự phụ thuộc vào ZooKeeper, tích hợp quản lý vào chính Broker.
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-purple-300 font-semibold text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Tích hợp & Tự trị
                </h4>
                <ul className="list-disc list-inside text-xs text-gray-400 pl-5 space-y-1">
                   <li>Broker đóng vai trò kép: Quản lý hoặc Lưu trữ dữ liệu.</li>
                   <li>Loại bỏ điểm lỗi đơn lẻ (SPOF) từ bên thứ 3.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-purple-300 font-semibold text-sm mb-1 flex items-center gap-2">
                   <CheckCircle2 size={14} /> Quản lý Metadata Tập trung
                </h4>
                <p className="text-xs text-gray-400 pl-5 leading-relaxed">
                  Controller sử dụng <b>giao thức Raft</b> để đồng bộ trạng thái. Metadata được lưu ngay trong một Topic nội bộ (`@metadata`) thay vì hệ thống ngoài.
                </p>
              </div>

              <div>
                <h4 className="text-purple-300 font-semibold text-sm mb-1 flex items-center gap-2">
                   <CheckCircle2 size={14} /> Hiệu năng cao
                </h4>
                <p className="text-xs text-gray-400 pl-5 leading-relaxed">
                  Khởi động và phục hồi cụm nhanh hơn do không cần tải metadata từ Zookeeper.
                </p>
              </div>
            </div>
          </div>

        </div>
        
        {/* Footer Summary */}
        <div className="p-6 bg-gray-900 border-t border-gray-800">
             <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Tóm tắt</h4>
             <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-2 rounded bg-black/40 border border-gray-800">
                    <span className="text-blue-400 font-bold">ZooKeeper:</span> Dịch vụ bên ngoài, cung cấp "Nguồn chân lý" (Source of Truth) cho cấu hình.
                </div>
                <div className="p-2 rounded bg-black/40 border border-gray-800">
                    <span className="text-purple-400 font-bold">KRaft:</span> Giao thức tích hợp, giúp Kafka trở thành hệ thống tự trị (Self-contained).
                </div>
             </div>
        </div>

      </div>
    </div>
  );
};
