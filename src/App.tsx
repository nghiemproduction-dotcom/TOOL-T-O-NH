import React, { useState, useRef, useEffect } from "react";
import { Upload, ImageIcon, Loader2, Download, Wand2, Check, Sparkles, Key, X, Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { presets, generateImageVariation } from "./lib/gemini";

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(presets[0].id);
  const [userModifier, setUserModifier] = useState<string>("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");

  const [generatedImages, setGeneratedImages] = useState<{ b64: string; index: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API Key Management
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState("");
  const [hasQuotaError, setHasQuotaError] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("NGHIEMART_GEMINI_KEY");
    if (savedKey) {
      setCustomApiKey(savedKey);
      setTempKey(savedKey);
    }
  }, []);

  const handleSaveKey = () => {
    localStorage.setItem("NGHIEMART_GEMINI_KEY", tempKey);
    setCustomApiKey(tempKey);
    setShowKeyModal(false);
    setHasQuotaError(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const mimetypeMatch = result.match(/^data:(.*);base64,(.*)$/);
        if (mimetypeMatch) {
          setMimeType(mimetypeMatch[1]);
          setBase64Data(mimetypeMatch[2]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!base64Data || !mimeType) {
      alert("Vui lòng tải lên một bức ảnh chân dung.");
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratedImages([]);
      
      const preset = presets.find((p) => p.id === selectedPresetId);
      if (!preset) throw new Error("Không tìm thấy preset.");

      const variations = preset.prompts;

      for (let i = 0; i < variations.length; i++) {
        setLoadingStep(`Đang xử lý ảnh ${i + 1}/3...`);
        try {
          const b64 = await generateImageVariation(
            variations[i], 
            base64Data, 
            mimeType, 
            userModifier,
            customApiKey
          );
          if (b64) {
            setGeneratedImages((prev) => [...prev, { b64, index: i + 1 }]);
          }
        } catch (verr: any) {
          console.error(`Error generating variation ${i + 1}:`, verr);
          if (verr?.message === "QUOTA_EXCEEDED" || verr?.message === "MISSING_API_KEY") {
             setHasQuotaError(true);
             setShowKeyModal(true);
             throw new Error("Lượt dùng miễn phí của hệ thống đã hết. Vui lòng nhập API Key Pro của bạn để tiếp tục.");
          }
          if (i === 0) throw verr;
        }
      }

      setLoadingStep("Thành công!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Đã xảy ra lỗi không xác định.");
    } finally {
      setIsGenerating(false);
      setLoadingStep("");
    }
  };

  const handleDownload = (b64: string, index: number) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${b64}`;
    link.download = `nghiemart-${selectedPresetId}-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-orange-500/30">
      <div className="max-w-md mx-auto bg-black min-h-screen shadow-2xl flex flex-col border-x border-neutral-900 relative">
        
        {/* Header */}
        <header className="px-8 py-8 border-b border-neutral-900 bg-black/80 backdrop-blur-xl sticky top-0 z-20 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3 text-white italic">
              <Sparkles className="w-6 h-6 text-orange-500 fill-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
              NGHIEMART
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-orange-500/70 font-black mt-1">Tools Studio v3.2</p>
          </div>
          
          <button 
            onClick={() => setShowKeyModal(true)}
            className={`p-3 rounded-2xl transition-all ${customApiKey ? "bg-orange-500/10 text-orange-500" : "bg-neutral-900 text-neutral-500"}`}
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 px-5 py-8 flex flex-col gap-10">
          
          {/* Upload */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                01. Dữ liệu đầu vào
              </Label>
              {previewUrl && (
                <div className="flex items-center gap-1.5 bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-[9px] font-black animate-pulse">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                   DATA READY
                </div>
              )}
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative overflow-hidden aspect-square rounded-[3rem] border-2 border-dashed transition-all duration-500 cursor-pointer flex flex-col items-center justify-center bg-neutral-900/30
                ${previewUrl ? "border-orange-500/30 shadow-[0_0_40px_rgba(249,115,22,0.05)]" : "border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/50"}`}
            >
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
              
              {previewUrl ? (
                <div className="absolute inset-0 group">
                  <img src={previewUrl} className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-1000" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <Button variant="secondary" size="sm" className="bg-white text-black font-black rounded-2xl h-12 px-6">Đổi ảnh khác</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center px-6">
                  <div className="w-20 h-20 bg-neutral-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-neutral-800 shadow-2xl transition-transform hover:scale-110">
                    <Upload className="w-8 h-8 text-neutral-600" />
                  </div>
                  <p className="text-base font-black text-neutral-200 tracking-tight">TẢI ẢNH CHÂN DUNG</p>
                  <p className="text-[10px] text-neutral-600 mt-2 font-bold uppercase tracking-widest">Tap to select photo</p>
                </div>
              )}
            </div>
          </section>

          {/* Functions */}
          <section>
            <Label className="mb-4 block text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
              02. Chọn chức năng xử lý
            </Label>
            <div className="grid grid-cols-1 gap-4">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPresetId(preset.id);
                    setGeneratedImages([]);
                  }}
                  className={`relative p-6 rounded-3xl border-2 text-left transition-all duration-300 group overflow-hidden
                    ${selectedPresetId === preset.id 
                      ? "border-orange-500 bg-orange-600/10 shadow-[0_0_30px_rgba(249,115,22,0.1)] scale-[1.02]" 
                      : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-800"}`}
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <span className={`text-base font-black tracking-tight block transition-colors ${selectedPresetId === preset.id ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"}`}>
                        {preset.name}
                      </span>
                      <p className={`text-[10px] mt-1 font-bold ${selectedPresetId === preset.id ? "text-orange-400" : "text-neutral-600"}`}>
                        {preset.id === "gao-tam-cam" ? "3 Phiên bản (Cát, Chì, Nước)" : "Siêu nét, Tách nền, Khử noise"}
                      </p>
                    </div>
                    {selectedPresetId === preset.id && (
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/50 animate-in zoom-in duration-300">
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  {selectedPresetId === preset.id && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-[50px] -mr-16 -mt-16 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Modifier */}
          <section>
            <Label className="mb-4 block text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
              03. Yêu cầu tinh chỉnh (Tuỳ chọn)
            </Label>
            <Textarea 
              placeholder="Nhập thêm yêu cầu (vd: làm môi đỏ hơn, tóc đen bóng...)" 
              value={userModifier}
              onChange={(e) => setUserModifier(e.target.value)}
              className="bg-neutral-900/50 border-neutral-800 focus:border-orange-500 focus:ring-0 transition-all min-h-[120px] rounded-3xl text-sm placeholder:text-neutral-700 p-6"
            />
          </section>

          {/* Action */}
          <Button 
            className="h-20 text-xl font-black bg-orange-600 hover:bg-orange-500 text-white rounded-[2.5rem] shadow-[0_15px_30px_-10px_rgba(249,115,22,0.6)] transition-all active:scale-[0.96] disabled:bg-neutral-800 disabled:text-neutral-600"
            onClick={handleGenerate}
            disabled={isGenerating || !base64Data}
          >
            {isGenerating ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="animate-pulse">ĐANG XỬ LÝ...</span>
                </div>
                <span className="text-[10px] font-bold mt-1 text-orange-200 opacity-60">{loadingStep}</span>
              </div>
            ) : (
              <span className="flex items-center gap-4">
                <Wand2 className="w-7 h-7" />
                BẮT ĐẦU NGAY
              </span>
            )}
          </Button>

          {/* Results */}
          {generatedImages.length > 0 && (
            <section className="mt-14 mb-14 space-y-10 animate-in slide-in-from-bottom-5 duration-700">
              <div className="flex items-center gap-6">
                <div className="h-px flex-1 bg-neutral-800" />
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase underline decoration-orange-500 decoration-[6px] underline-offset-[8px]">
                  KẾT QUẢ ĐÃ XỬ LÝ
                </h3>
                <div className="h-px flex-1 bg-neutral-800" />
              </div>
              
              <div className="grid grid-cols-1 gap-16">
                {[...generatedImages].reverse().map((img) => (
                  <div key={img.index} className="group flex flex-col gap-5">
                    <div className="relative bg-neutral-950 rounded-[3rem] overflow-hidden border border-neutral-800 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] transition-all hover:border-neutral-700">
                      <img 
                        src={`data:image/png;base64,${img.b64}`} 
                        alt={`Art ${img.index}`} 
                        className="w-full h-auto object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                        <Button 
                          onClick={() => handleDownload(img.b64, img.index)}
                          className="w-full bg-white text-black hover:bg-neutral-200 font-black py-8 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl text-lg uppercase tracking-tight"
                        >
                          <Download className="w-6 h-6" />
                          Tải ảnh chất lượng cao
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-4">
                       <span className="text-xs font-black uppercase tracking-[0.3em] text-neutral-600">
                        PHIÊN BẢN {img.index}
                       </span>
                       <button 
                         onClick={() => handleDownload(img.b64, img.index)} 
                         className="w-12 h-12 flex items-center justify-center bg-neutral-800 rounded-2xl hover:bg-orange-500 hover:text-white transition-all text-orange-500 shadow-lg"
                       >
                          <Download className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>
        
        <footer className="p-8 text-center border-t border-neutral-900 bg-neutral-950/50">
           <p className="text-[10px] font-bold text-neutral-600 tracking-[0.2em] uppercase">Powered by Gemini & NghiemArt</p>
        </footer>

        {/* API Key Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowKeyModal(false)} />
            <div className="relative bg-neutral-900 w-full max-w-sm rounded-[2.5rem] border border-neutral-800 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setShowKeyModal(false)}
                className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                  <Key className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-xl font-black text-white italic tracking-tight underline decoration-orange-500 decoration-4">GEMINI PRO API</h2>
                {hasQuotaError ? (
                  <p className="text-xs text-orange-400 mt-2 font-bold uppercase tracking-wider px-4 bg-orange-400/10 py-2 rounded-xl border border-orange-400/20">
                    Hết lượt dùng miễn phí! Hãy nhập Key của bạn.
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500 mt-2 font-bold uppercase tracking-widest px-4">
                    Nhập API Key để sử dụng không giới hạn lượt tạo ảnh hàng ngày.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-neutral-400">Your API Key</Label>
                  <Input 
                    type="password"
                    placeholder="Nhập mã AI Key của bạn..."
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    className="h-14 bg-black border-neutral-800 focus:border-orange-500 rounded-2xl text-center font-mono text-sm"
                  />
                </div>
                
                <Button 
                  onClick={handleSaveKey}
                  className="w-full h-14 bg-white text-black hover:bg-neutral-200 font-black rounded-2xl uppercase tracking-widest text-xs"
                >
                  LƯU CẤU HÌNH
                </Button>
                
                <p className="text-[10px] text-neutral-600 text-center leading-relaxed font-bold">
                  Key được lưu an toàn trên trình duyệt của bạn.<br />
                  Lấy key miễn phí tại: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-orange-500 underline">aistudio.google.com</a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
