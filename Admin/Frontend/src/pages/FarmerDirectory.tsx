import React, { useState } from 'react';
import type { FarmerUser, AdminUser, FarmerProduceListing } from '../types/admin';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { mockFarmers as initialMockFarmers } from './FarmerDirectoryMock';

// Crop photo resolver ensuring reliable, high-resolution agricultural images
export const getCropFallbackImage = (cropName: string = '', category: string = '') => {
  const name = (cropName || '').toLowerCase();
  const cat = (category || '').toLowerCase();
  if (name.includes('tomato')) return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80';
  if (name.includes('onion')) return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80';
  if (name.includes('potato') || name.includes('alu') || name.includes('aloo')) return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80';
  if (name.includes('wheat') || name.includes('gehu')) return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80';
  if (name.includes('rice') || name.includes('paddy') || name.includes('chawal')) return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80';
  if (name.includes('soybean') || name.includes('soya')) return 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&auto=format&fit=crop&q=80';
  if (name.includes('corn') || name.includes('maize') || name.includes('makka')) return 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=80';
  if (name.includes('chilli') || name.includes('chili') || name.includes('mirchi')) return 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&auto=format&fit=crop&q=80';
  if (name.includes('garlic') || name.includes('lahsun')) return 'https://images.unsplash.com/photo-1615477550926-25ccbf3a9ec1?w=500&auto=format&fit=crop&q=80';
  if (name.includes('ginger') || name.includes('adrak')) return 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80';
  if (name.includes('apple') || name.includes('seb')) return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80';
  if (name.includes('mango') || name.includes('aam')) return 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80';
  if (name.includes('banana') || name.includes('kela')) return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80';
  if (name.includes('pomegranate') || name.includes('anar')) return 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80';
  if (name.includes('grape') || name.includes('angoor')) return 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&auto=format&fit=crop&q=80';
  if (name.includes('orange') || name.includes('santra') || name.includes('santre')) return 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=500&auto=format&fit=crop&q=80';
  if (name.includes('carrot') || name.includes('gajar')) return 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop&q=80';
  if (name.includes('cabbage') || name.includes('patta gobi') || name.includes('gobi')) return 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=500&auto=format&fit=crop&q=80';
  if (name.includes('cauliflower') || name.includes('phool gobi')) return 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500&auto=format&fit=crop&q=80';
  if (name.includes('peas') || name.includes('matar')) return 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=500&auto=format&fit=crop&q=80';
  if (name.includes('cucumber') || name.includes('kheera')) return 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500&auto=format&fit=crop&q=80';
  if (cat.includes('fruit')) return 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80';
  if (cat.includes('grain')) return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80';
  return 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=500&auto=format&fit=crop&q=80';
};

interface FarmerDirectoryProps {
  user: AdminUser;
  onLogout: () => void;
  onNavigateTab: (tabId: string) => void;
  onSelectFarmer: (farmer: FarmerUser) => void;
}

export const FarmerDirectory: React.FC<FarmerDirectoryProps> = ({
  user,
  onLogout,
  onNavigateTab,
  onSelectFarmer,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isLoadingProduce, setIsLoadingProduce] = useState(false);

  // Initialize farmers with localStorage persistence or empty array for live backend hydration
  const [farmers, setFarmers] = useState<FarmerUser[]>(() => {
    try {
      const saved = localStorage.getItem('mandikart_admin_farmers_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING_KYC' | 'SUSPENDED'>('ALL');
  const [moderationTab, setModerationTab] = useState<'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'ALL'>('PENDING');
  const [rawLiveProduce, setRawLiveProduce] = useState<any[]>([]);

  // Safe localStorage helper
  const safeSaveFarmers = (farmersToSave: FarmerUser[]) => {
    try {
      const sanitized = farmersToSave.map(f => ({
        id: f.id,
        farmerCode: f.farmerCode,
        fullName: f.fullName,
        phone: f.phone,
        district: f.district,
        state: f.state,
        verificationStatus: f.verificationStatus,
        activeListings: (f.activeListings || []).slice(0, 10).map(l => ({
          id: l.id,
          cropName: l.cropName,
          category: l.category,
          pricePerKg: l.pricePerKg,
          availableKg: l.availableKg,
          status: l.status,
          imageUrl: l.imageUrl,
          images: l.images || (l.imageUrl ? [l.imageUrl] : []),
        })),
      }));
      localStorage.setItem('mandikart_admin_farmers_data', JSON.stringify(sanitized));
    } catch {}
  };

  const fetchFarmersAndProduce = async (showSpinner = false) => {
    if (showSpinner) setIsLoadingProduce(true);
    try {
      const [farmersRes, produceRes] = await Promise.all([
        fetch('http://localhost:4003/api/v1/admin/farmers').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('http://localhost:4003/api/v1/admin/produce').then(r => r.json()).catch(() => ({ data: [] })),
      ]);

      const liveProduceList = Array.isArray(produceRes?.data) ? produceRes.data : [];
      // Sort produce time-wise descending
      liveProduceList.sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || a.submittedAt || 0).getTime();
        const timeB = new Date(b.createdAt || b.submittedAt || 0).getTime();
        return timeB - timeA;
      });
      setRawLiveProduce(liveProduceList);

      if (Array.isArray(farmersRes?.data) && farmersRes.data.length > 0) {
        const produceByFarmer = new Map<string, any[]>();
        for (const prod of liveProduceList) {
          const fId = prod.farmerId;
          const cur = produceByFarmer.get(fId) || [];
          cur.push(prod);
          produceByFarmer.set(fId, cur);
        }

        const mergedFarmers: FarmerUser[] = farmersRes.data.map((f: any) => {
          const associatedProduce = produceByFarmer.get(f.id) || f.activeListings || [];
          return {
            id: f.id,
            farmerCode: f.farmerCode || `FMR-${String(f.id).slice(-4).toUpperCase()}`,
            fullName: f.fullName || 'Farmer',
            phone: f.phone || '+91 98000 00000',
            mandiName: f.mandiName || `${f.district || 'Nashik'} APMC`,
            district: f.district || 'Nashik',
            state: f.state || 'Maharashtra',
            landAreaAcres: Number(f.landAreaAcres || 5),
            verificationStatus: f.verificationStatus || 'VERIFIED',
            rating: f.rating || 4.8,
            totalSalesAmount: Number(f.totalSalesAmount || 0),
            joinedDate: f.joinedDate || 'Recent',
            kycRecords: [],
            activeListings: associatedProduce.map((p: any) => {
              const crop = p.cropName || p.crop_name || 'Produce';
              const cat = p.category || 'Vegetables';
              const fallbackImg = getCropFallbackImage(crop, cat);
              const rawImg = p.imageUrl || (p.images && p.images[0]);
              const isOldHardcodedOnionUrl = rawImg && rawImg.includes('AB6AXuC5ju') && !crop.toLowerCase().includes('onion');
              const validImg = (rawImg && !rawImg.startsWith('file://') && !isOldHardcodedOnionUrl) ? rawImg : fallbackImg;
              return {
                id: p.id,
                farmerId: f.id,
                farmerName: f.fullName,
                farmerCode: f.farmerCode,
                cropName: crop,
                category: cat,
                availableKg: Number(p.availableKg || p.available_quantity || p.quantityKg || 100),
                pricePerKg: Number(p.pricePerKg || p.base_price_per_unit || 30),
                qualityGrade: p.qualityGrade || (p.grade === 'B' ? 'GRADE_B' : 'GRADE_A'),
                harvestDate: p.harvestDate || p.harvest_date || 'Recent',
                submittedAt: p.submittedAt || (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Today'),
                createdAt: p.createdAt || new Date().toISOString(),
                status: p.status || (p.is_active ? 'ACTIVE' : 'PENDING_APPROVAL'),
                mandiName: p.mandiName || `${f.district || 'Nashik'} APMC`,
                imageUrl: validImg,
                images: [validImg],
              };
            }),
          };
        });

        setFarmers(mergedFarmers);
        safeSaveFarmers(mergedFarmers);
      }
    } catch (err) {
      console.warn('Failed to fetch live farmers/produce:', err);
    } finally {
      if (showSpinner) {
        setTimeout(() => setIsLoadingProduce(false), 400);
      }
    }
  };

  // Continuous 4-second polling
  React.useEffect(() => {
    fetchFarmersAndProduce(true);
    const pollInterval = setInterval(() => {
      fetchFarmersAndProduce(false);
    }, 4000);
    return () => clearInterval(pollInterval);
  }, []);
  
  // Notification & Modal State
  const [approvalNotification, setApprovalNotification] = useState<string | null>(null);
  const [showSimulateModal, setShowSimulateModal] = useState(false);

  // Farmer Produce Submission Simulation State
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(initialMockFarmers[0]?.id || '');
  const [simCropName, setSimCropName] = useState('');
  const [simCategory, setSimCategory] = useState('Vegetables');
  const [simQuantityKg, setSimQuantityKg] = useState<number>(2000);
  const [simPricePerKg, setSimPricePerKg] = useState<number>(45);
  const [simGrade, setSimGrade] = useState<'GRADE_A' | 'GRADE_B' | 'PREMIUM'>('GRADE_A');
  const [simImageUrl, setSimImageUrl] = useState('');

  // Extract all produce listings across all farmers
  const pendingProduceListings: (FarmerProduceListing & { farmerFullName: string; farmerCode: string })[] = [];
  const approvedProduceListings: (FarmerProduceListing & { farmerFullName: string; farmerCode: string })[] = [];
  const activeProduceListings: (FarmerProduceListing & { farmerFullName: string; farmerCode: string })[] = [];
  const rejectedProduceListings: (FarmerProduceListing & { farmerFullName: string; farmerCode: string })[] = [];
  const allProduceListings: (FarmerProduceListing & { farmerFullName: string; farmerCode: string })[] = [];

  const rawListToProcess = rawLiveProduce.length > 0
    ? rawLiveProduce.map(p => {
        const matchedFarmer = farmers.find(f => f.id === p.farmerId);
        const fullName = p.farmerName || p.farmerFullName || matchedFarmer?.fullName || 'Registered Farmer';
        const farmerCode = p.farmerCode || (matchedFarmer ? matchedFarmer.farmerCode : (p.farmerPhone ? `FARM-${p.farmerPhone.slice(-4)}` : `FARM-${String(p.farmerId || p.id).slice(-4)}`));
        const crop = p.cropName || 'Produce';
        const cat = p.category || 'Vegetables';
        const fallbackImg = getCropFallbackImage(crop, cat);
        const rawImg = p.imageUrl || (p.images && p.images[0]);
        const isOldHardcodedOnionUrl = rawImg && rawImg.includes('AB6AXuC5ju') && !crop.toLowerCase().includes('onion');
        const validImg = (rawImg && !rawImg.startsWith('file://') && !isOldHardcodedOnionUrl) ? rawImg : fallbackImg;

        return {
          id: p.id,
          farmerId: p.farmerId,
          farmerFullName: fullName,
          farmerName: fullName,
          farmerCode,
          cropName: crop,
          category: cat,
          availableKg: Number(p.availableKg || p.available_quantity || p.quantityKg || 100),
          pricePerKg: Number(p.pricePerKg || p.base_price_per_unit || 30),
          qualityGrade: p.qualityGrade || (p.grade === 'B' ? 'GRADE_B' : 'GRADE_A'),
          harvestDate: p.harvestDate || p.harvest_date || 'Recent',
          submittedAt: p.submittedAt || (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Today'),
          createdAt: p.createdAt || new Date().toISOString(),
          status: p.status || 'PENDING_APPROVAL',
          mandiName: p.mandiName || 'Nashik APMC',
          imageUrl: validImg,
          images: [validImg],
        };
      })
    : farmers.flatMap(f => f.activeListings.map(l => ({ ...l, farmerFullName: f.fullName, farmerCode: f.farmerCode })));

  rawListToProcess.forEach((item: any) => {
    allProduceListings.push(item);
    if (item.status === 'PENDING_APPROVAL') {
      pendingProduceListings.push(item);
    } else if (item.status === 'APPROVED' || item.status === 'ADMIN_APPROVED') {
      approvedProduceListings.push(item);
    } else if (item.status === 'ACTIVE') {
      activeProduceListings.push(item);
    } else if (item.status === 'REJECTED') {
      rejectedProduceListings.push(item);
    }
  });

  const sortByTime = (items: any[]) =>
    [...items].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.submittedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.submittedAt || 0).getTime();
      return timeB - timeA;
    });

  const displayedProduce = sortByTime(
    moderationTab === 'PENDING' 
      ? pendingProduceListings 
      : moderationTab === 'APPROVED'
      ? approvedProduceListings
      : moderationTab === 'ACTIVE' 
      ? activeProduceListings 
      : moderationTab === 'REJECTED'
      ? rejectedProduceListings
      : allProduceListings
  );

  // Approve Produce Listing Handler (Admin verifies produce -> unlocked for farmer to list globally)
  const handleApproveProduce = (farmerId: string, listingId: string, cropName: string) => {
    // Call Admin backend API to update Supabase & shared registry
    fetch(`http://localhost:4003/api/v1/admin/produce/${listingId}/approve`, {
      method: 'POST',
    }).catch(err => console.warn('Approve produce API notice:', err));

    try {
      const savedApproved = localStorage.getItem('mandikart_approved_listing_ids');
      const approvedIds = savedApproved ? JSON.parse(savedApproved) : [];
      if (!approvedIds.includes(listingId)) {
        approvedIds.push(listingId);
        localStorage.setItem('mandikart_approved_listing_ids', JSON.stringify(approvedIds));
      }
    } catch {}

    setFarmers(prev => {
      const updated = prev.map(f => {
        if (f.id === farmerId || f.activeListings.some(l => l.id === listingId)) {
          return {
            ...f,
            activeListings: f.activeListings.map(l => {
              if (l.id === listingId) {
                return { ...l, status: 'APPROVED' as any };
              }
              return l;
            })
          };
        }
        return f;
      });
      safeSaveFarmers(updated);
      return updated;
    });

    setApprovalNotification(`QUALITY VERIFIED: "${cropName}" quality approved by Admin! Produce is unlocked — awaiting farmer confirmation to list globally.`);
    setTimeout(() => setApprovalNotification(null), 7000);
  };

  // Reject / Unpublish Produce Listing Handler
  const handleRejectProduce = (farmerId: string, listingId: string, cropName: string) => {
    fetch(`http://localhost:4003/api/v1/admin/produce/${listingId}/reject`, {
      method: 'POST',
    }).catch(err => console.warn('Reject produce API notice:', err));

    // Remove from approved list if present
    try {
      const savedApproved = localStorage.getItem('mandikart_approved_listing_ids');
      if (savedApproved) {
        const ids: string[] = JSON.parse(savedApproved).filter((id: string) => id !== listingId);
        localStorage.setItem('mandikart_approved_listing_ids', JSON.stringify(ids));
      }
    } catch {}

    setFarmers(prev => {
      const updated = prev.map(f => {
        if (f.id === farmerId || f.activeListings.some(l => l.id === listingId)) {
          return {
            ...f,
            activeListings: f.activeListings.map(l => {
              if (l.id === listingId) {
                return { ...l, status: 'REJECTED' as const };
              }
              return l;
            })
          };
        }
        return f;
      });
      safeSaveFarmers(updated);
      return updated;
    });

    setApprovalNotification(`PRODUCE REJECTED: "${cropName}" listing rejected and unpublished from marketplace.`);
    setModerationTab('REJECTED'); // Switch to Rejected tab so admin immediately sees it!
    setTimeout(() => setApprovalNotification(null), 6000);
  };

  // Simulate Farmer Submitting Product Handler
  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simCropName) return;

    const targetFarmer = farmers.find(f => f.id === selectedFarmerId);
    const resolvedImg = simImageUrl.trim() || getCropFallbackImage(simCropName, simCategory);
    const newListing: FarmerProduceListing = {
      id: `lst-sim-${Date.now()}`,
      farmerId: selectedFarmerId,
      farmerName: targetFarmer?.fullName,
      farmerCode: targetFarmer?.farmerCode,
      cropName: simCropName,
      category: simCategory,
      availableKg: Number(simQuantityKg),
      pricePerKg: Number(simPricePerKg),
      qualityGrade: simGrade,
      harvestDate: 'Today',
      status: 'PENDING_APPROVAL',
      mandiName: targetFarmer?.mandiName || 'Central Mandi',
      submittedAt: 'Just Now',
      labCertificateNumber: `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
      imageUrl: resolvedImg,
      images: [resolvedImg],
    };

    setFarmers(prev => {
      const updated = prev.map(f => {
        if (f.id === selectedFarmerId) {
          return {
            ...f,
            activeListings: [newListing, ...f.activeListings]
          };
        }
        return f;
      });
      try {
        localStorage.setItem('mandikart_admin_farmers_data', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setShowSimulateModal(false);
    setSimCropName('');
    setSimImageUrl('');
    setModerationTab('PENDING');
    setApprovalNotification(`FARMER SUBMISSION RECEIVED: Farmer ${targetFarmer?.fullName} submitted "${simCropName}". Added to Admin Moderation Queue with product image!`);
    setTimeout(() => setApprovalNotification(null), 7000);
  };

  const filteredFarmers = farmers.filter((farmer) => {
    const matchesSearch =
      farmer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmer.farmerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmer.mandiName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmer.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || farmer.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = farmers.length;
  const verifiedCount = farmers.filter((f) => f.verificationStatus === 'VERIFIED').length;
  const pendingCount = farmers.filter((f) => f.verificationStatus === 'PENDING_KYC').length;
  const suspendedCount = farmers.filter((f) => f.verificationStatus === 'SUSPENDED').length;

  return (
    <div className="flex min-h-screen bg-black font-sans text-white">
      <Sidebar
        activeTab="farmers"
        onTabChange={onNavigateTab}
        onLogout={onLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onLogout={onLogout}
          onNavigateTab={onNavigateTab}
          onRefresh={() => fetchFarmersAndProduce(true)}
          isRefreshing={isLoadingProduce}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1500px] w-full mx-auto">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Farmer Directory & Produce Moderation
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-400">
                  Live DB ({farmers.length} Farmers)
                </span>
              </div>
              <p className="text-xs text-slate-300 font-semibold mt-0.5">
                Inspect producer profiles, verify KYC land records, and approve newly submitted produce listings before publishing to buyers.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fetchFarmersAndProduce(true)}
                disabled={isLoadingProduce}
                className="px-3 py-1.5 bg-zinc-900 text-zinc-200 hover:text-white hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-400 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh real-time farmers and produce"
              >
                <span className={`material-symbols-outlined text-sm ${isLoadingProduce ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`}>sync</span>
                <span>Refresh Live</span>
              </button>

              <button 
                onClick={() => setShowSimulateModal(true)}
                className="px-3.5 py-1.5 bg-orange-950 text-orange-400 border border-orange-400 hover:bg-orange-400 hover:text-black rounded-lg text-xs font-black transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                <span>Simulate Farmer Adding Product</span>
              </button>
            </div>
          </div>

          {/* Action & Moderation Notification Alert */}
          {approvalNotification && (
            <div className="p-4 bg-emerald-950 border border-emerald-400 rounded-xl text-emerald-300 text-xs font-mono font-bold flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-base">task_alt</span>
                <span>{approvalNotification}</span>
              </div>
              <button onClick={() => setApprovalNotification(null)} className="text-emerald-400 hover:text-white font-bold">
                ✕
              </button>
            </div>
          )}

          {/* SECTION: PRODUCE MODERATION & MARKETPLACE LIVE REGISTRY (Farmer -> Admin -> User) */}
          <div className="bg-black rounded-xl border border-white p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-400 text-2xl">verified</span>
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-wider">
                    Farmer Produce Moderation & Marketplace Registry
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono">
                    Inspect farmer submitted crop lots, verify photographic quality & assay grades, and publish approved lots to buyers.
                  </p>
                </div>
              </div>

              {/* Moderation Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 border border-zinc-800 rounded-lg text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setModerationTab('PENDING')}
                  className={`px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1.5 ${
                    moderationTab === 'PENDING'
                      ? 'bg-orange-950 text-orange-400 border border-orange-400'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                  <span>Pending Approval ({pendingProduceListings.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModerationTab('APPROVED')}
                  className={`px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1.5 ${
                    moderationTab === 'APPROVED'
                      ? 'bg-sky-950 text-sky-400 border border-sky-400'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">verified</span>
                  <span>Quality Approved ({approvedProduceListings.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModerationTab('ACTIVE')}
                  className={`px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1.5 ${
                    moderationTab === 'ACTIVE'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-400'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">store</span>
                  <span>Live Marketplace ({activeProduceListings.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModerationTab('REJECTED')}
                  className={`px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1.5 ${
                    moderationTab === 'REJECTED'
                      ? 'bg-rose-950 text-rose-400 border border-rose-400'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>Rejected ({rejectedProduceListings.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModerationTab('ALL')}
                  className={`px-3 py-1.5 rounded font-bold transition-colors ${
                    moderationTab === 'ALL'
                      ? 'bg-white text-black font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All ({allProduceListings.length})
                </button>

                {/* Refresh Produce Moderation Button */}
                <button
                  type="button"
                  onClick={() => fetchFarmersAndProduce(true)}
                  disabled={isLoadingProduce}
                  className="px-2.5 py-1.5 bg-zinc-900 text-zinc-200 hover:text-white hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-400 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Refresh Produce Submissions"
                >
                  <span className={`material-symbols-outlined text-sm ${isLoadingProduce ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`}>sync</span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {displayedProduce.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayedProduce.map(listing => {
                  const totalLotValue = listing.availableKg * listing.pricePerKg;
                  const isPending = listing.status === 'PENDING_APPROVAL';
                  const isApproved = listing.status === 'APPROVED' || listing.status === 'ADMIN_APPROVED';
                  const isActive = listing.status === 'ACTIVE';

                  return (
                    <div 
                      key={listing.id} 
                      className={`bg-zinc-950 border ${
                        isPending 
                          ? 'border-orange-400/80 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                          : isApproved
                          ? 'border-sky-500/80 shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                          : isActive 
                          ? 'border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                          : 'border-zinc-800'
                      } p-4 rounded-lg space-y-3 font-mono transition-all`}
                    >
                      <div className="flex gap-3.5 items-start">
                        {/* High-Resolution Produce Product Image */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden shrink-0 border border-zinc-700 bg-zinc-900 shadow-md group">
                          <img
                            src={listing.imageUrl || getCropFallbackImage(listing.cropName, listing.category)}
                            alt={listing.cropName}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getCropFallbackImage(listing.cropName, listing.category);
                            }}
                          />
                          <span className={`absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg backdrop-blur-sm ${
                            isActive
                              ? 'bg-emerald-950/95 text-emerald-400 border border-emerald-400'
                              : isApproved
                              ? 'bg-sky-950/95 text-sky-400 border border-sky-400'
                              : isPending
                              ? 'bg-orange-950/95 text-orange-400 border border-orange-400 animate-pulse'
                              : 'bg-rose-950/95 text-rose-400 border border-rose-400'
                          }`}>
                            {isActive ? 'LIVE' : isApproved ? 'APPROVED' : isPending ? 'PENDING' : 'REJECTED'}
                          </span>
                        </div>

                        {/* Produce Identity & Counterparty Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="text-xs text-zinc-400 flex items-center gap-1 truncate">
                              <span className="material-symbols-outlined text-xs text-emerald-400 shrink-0">person</span>
                              <strong className="text-white truncate">{listing.farmerFullName}</strong> 
                              <span className="text-zinc-500 shrink-0">({listing.farmerCode})</span>
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] font-bold shrink-0 rounded ${
                              isActive
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-400'
                                : isApproved
                                ? 'bg-sky-950 text-sky-400 border border-sky-400'
                                : isPending
                                ? 'bg-orange-950 text-orange-400 border border-orange-400 animate-pulse'
                                : 'bg-rose-950 text-rose-400 border border-rose-400'
                            }`}>
                              {isActive ? 'APPROVED & LIVE' : isApproved ? 'QUALITY VERIFIED' : isPending ? 'PENDING APPROVAL' : 'REJECTED'}
                            </span>
                          </div>

                          <h3 className="text-base font-black text-white mt-1 truncate">{listing.cropName}</h3>
                          <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded text-zinc-300">
                              {listing.category}
                            </span>
                            <span>•</span>
                            <span className="text-zinc-400">Mandi: {listing.mandiName}</span>
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                            Submitted: <strong className="text-emerald-400 font-semibold">{
                              ((listing as any).createdAt && !isNaN(new Date((listing as any).createdAt).getTime()))
                                ? new Date((listing as any).createdAt).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                  })
                                : listing.submittedAt || 'Today'
                            }</strong>
                          </div>
                        </div>
                      </div>

                      {/* Financial & Inventory Telemetry */}
                      <div className="grid grid-cols-3 gap-2 bg-black border border-zinc-800 p-2.5 rounded text-xs">
                        <div>
                          <span className="text-zinc-500 block text-[10px]">AVAILABLE:</span>
                          <span className="text-white font-bold">{(Number(listing.availableKg) || 0).toLocaleString()} kg</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">PRICE/KG:</span>
                          <span className="text-emerald-400 font-bold">₹{listing.pricePerKg}/kg</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">LOT VALUE:</span>
                          <span className="text-white font-bold">₹{(Number(totalLotValue) || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-400 flex justify-between items-center pt-1 border-t border-zinc-800">
                        <span>Quality Grade: <strong className="text-emerald-400">{listing.qualityGrade}</strong></span>
                        <span>Lab Assay Cert: <strong className="text-zinc-300">{listing.labCertificateNumber || 'Verified-MK'}</strong></span>
                      </div>

                      {/* Admin Decision Actions */}
                      <div className="pt-1">
                        {isPending && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleApproveProduce(listing.farmerId!, listing.id, listing.cropName)}
                              className="py-2 bg-emerald-950 border border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black text-xs font-bold uppercase transition-colors rounded flex items-center justify-center gap-1 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              <span>Accept & Verify Quality</span>
                            </button>
                            <button
                              onClick={() => handleRejectProduce(listing.farmerId!, listing.id, listing.cropName)}
                              className="py-2 bg-rose-950 border border-rose-400 text-rose-400 hover:bg-rose-400 hover:text-black text-xs font-bold uppercase transition-colors rounded flex items-center justify-center gap-1 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-sm">cancel</span>
                              <span>Reject Listing</span>
                            </button>
                          </div>
                        )}

                        {isApproved && (
                          <div className="flex items-center justify-between gap-2 bg-sky-950/40 border border-sky-500/40 p-2 rounded">
                            <div className="flex items-center gap-1.5 text-xs text-sky-400">
                              <span className="material-symbols-outlined text-sm">task_alt</span>
                              <span className="font-bold">Quality Verified — Awaiting Farmer Global Broadcast</span>
                            </div>
                            <button
                              onClick={() => handleRejectProduce(listing.farmerId!, listing.id, listing.cropName)}
                              className="px-2.5 py-1 bg-zinc-900 border border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black text-[11px] font-bold uppercase transition-colors rounded"
                            >
                              Unpublish
                            </button>
                          </div>
                        )}

                        {isActive && (
                          <div className="flex items-center justify-between gap-2 bg-emerald-950/40 border border-emerald-500/40 p-2 rounded">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                              <span className="material-symbols-outlined text-sm">storefront</span>
                              <span className="font-bold">Live on MandiKart User Marketplace</span>
                            </div>
                            <button
                              onClick={() => handleRejectProduce(listing.farmerId!, listing.id, listing.cropName)}
                              className="px-2.5 py-1 bg-zinc-900 border border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black text-[11px] font-bold uppercase transition-colors rounded"
                            >
                              Unpublish Listing
                            </button>
                          </div>
                        )}

                        {listing.status === 'REJECTED' && (
                          <div className="flex items-center justify-between gap-2 bg-rose-950/40 border border-rose-500/40 p-2 rounded">
                            <span className="text-xs text-rose-400 font-bold">Listing currently rejected</span>
                            <button
                              onClick={() => handleApproveProduce(listing.farmerId!, listing.id, listing.cropName)}
                              className="px-2.5 py-1 bg-emerald-950 border border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black text-[11px] font-bold uppercase transition-colors rounded"
                            >
                              Re-Approve & Publish
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-lg text-center text-xs font-mono text-zinc-400 space-y-3">
                <span className="material-symbols-outlined text-emerald-400 text-3xl">verified</span>
                <div className="text-sm font-bold text-white">
                  {moderationTab === 'PENDING' 
                    ? 'All submitted farmer produce listings have been moderated and published live!' 
                    : moderationTab === 'REJECTED'
                    ? 'No produce listings are currently in the rejected state.'
                    : 'No listings in this view.'}
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  {moderationTab === 'PENDING' && activeProduceListings.length > 0 && (
                    <button
                      onClick={() => setModerationTab('ACTIVE')}
                      className="px-3 py-1.5 bg-emerald-950 border border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black text-xs font-bold transition-colors rounded"
                    >
                      View Live Approved Produce ({activeProduceListings.length}) →
                    </button>
                  )}
                  <button 
                    onClick={() => setShowSimulateModal(true)}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-white text-xs font-bold hover:bg-white hover:text-black transition-colors rounded"
                  >
                    + Simulate Farmer Submitting Product
                  </button>
                </div>
              </div>
            )}
          </div>


          {/* Directory Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black p-4 rounded-xl border border-white shadow-md">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Total Onboarded</div>
              <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
            </div>

            <div className="bg-black p-4 rounded-xl border border-emerald-400 shadow-md">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">KYC Verified (Green)</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{verifiedCount}</div>
            </div>

            <div className="bg-black p-4 rounded-xl border border-orange-400 shadow-md">
              <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Pending KYC Review</div>
              <div className="text-2xl font-black text-orange-400 mt-1">{pendingCount}</div>
            </div>

            <div className="bg-black p-4 rounded-xl border border-rose-400 shadow-md">
              <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Suspended (Red)</div>
              <div className="text-2xl font-black text-rose-400 mt-1">{suspendedCount}</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-black p-3.5 rounded-xl border border-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Filter by farmer name, ID (#FMR-8921), phone, or Mandi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-black border border-white rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white font-mono"
              />
            </div>

            <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-bold border transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-black border-white'
                    : 'bg-black text-white border-white hover:bg-slate-900'
                }`}
              >
                All Statuses
              </button>
              <button
                onClick={() => setStatusFilter('VERIFIED')}
                className={`px-3 py-1 rounded-lg font-bold border transition-colors ${
                  statusFilter === 'VERIFIED'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-400'
                    : 'bg-black text-slate-300 border-zinc-800 hover:border-white'
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => setStatusFilter('PENDING_KYC')}
                className={`px-3 py-1 rounded-lg font-bold border transition-colors ${
                  statusFilter === 'PENDING_KYC'
                    ? 'bg-orange-950 text-orange-400 border-orange-400'
                    : 'bg-black text-slate-300 border-zinc-800 hover:border-white'
                }`}
              >
                Pending KYC
              </button>
            </div>
          </div>

          {/* Farmer Roster Table */}
          <div className="bg-black rounded-xl border border-white shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white bg-zinc-950 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3.5">Farmer & Code</th>
                    <th className="p-3.5">Mandi Region</th>
                    <th className="p-3.5">Land Holding</th>
                    <th className="p-3.5">KYC Status</th>
                    <th className="p-3.5">Active Crops</th>
                    <th className="p-3.5 text-right">Lifetime Sales</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-xs">
                  {filteredFarmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="p-3.5">
                        <div className="font-black text-white text-sm">{farmer.fullName}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{farmer.farmerCode}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{farmer.mandiName}</div>
                        <div className="text-slate-400 text-[11px]">{farmer.district}, {farmer.state}</div>
                      </td>
                      <td className="p-3.5 font-mono text-white font-bold">{farmer.landAreaAcres} Acres</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                            farmer.verificationStatus === 'VERIFIED'
                              ? 'bg-black text-emerald-400 border-emerald-400'
                              : farmer.verificationStatus === 'PENDING_KYC'
                              ? 'bg-black text-orange-400 border-orange-400'
                              : 'bg-black text-rose-400 border-rose-400'
                          }`}
                        >
                          {farmer.verificationStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {farmer.activeListings.map((l) => (
                            <span
                              key={l.id}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                                l.status === 'ACTIVE'
                                  ? 'bg-emerald-950 text-emerald-400 border-emerald-400'
                                  : l.status === 'PENDING_APPROVAL'
                                  ? 'bg-orange-950 text-orange-400 border-orange-400'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                              }`}
                            >
                              {l.cropName} {l.status === 'PENDING_APPROVAL' ? '(Pending)' : ''}
                            </span>
                          ))}
                          {farmer.activeListings.length === 0 && <span className="text-slate-500 font-mono">No listings</span>}
                        </div>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-white">
                        ₹{(Number(farmer.totalSalesAmount) || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => onSelectFarmer(farmer)}
                          className="px-3 py-1 bg-black hover:bg-white hover:text-black text-white text-xs font-mono font-bold rounded border border-white transition-colors"
                        >
                          Manage Profile →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal: Simulate Farmer Adding Product */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-black border border-white p-6 max-w-md w-full space-y-5 font-mono">
            <div className="flex justify-between items-center border-b border-white pb-3">
              <div>
                <span className="text-xs text-orange-400 uppercase font-bold">FARMER MARKETPLACE SIMULATOR</span>
                <h3 className="text-base font-black text-white">Farmer Add Product</h3>
              </div>
              <button 
                onClick={() => setShowSimulateModal(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                [CLOSE]
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Select Farmer:</label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full bg-black text-white border border-white p-2 focus:outline-none"
                >
                  {farmers.map(f => (
                    <option key={f.id} value={f.id}>{f.fullName} ({f.farmerCode} - {f.mandiName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Produce / Crop Name:</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Sweet Corn (Sugar75) or Fresh Carrots"
                  value={simCropName}
                  onChange={(e) => setSimCropName(e.target.value)}
                  className="w-full bg-black text-white border border-white p-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1">Available Qty (kg):</label>
                  <input 
                    type="number" 
                    required
                    value={simQuantityKg}
                    onChange={(e) => setSimQuantityKg(Number(e.target.value))}
                    className="w-full bg-black text-white border border-white p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Price per Kg (₹):</label>
                  <input 
                    type="number" 
                    required
                    value={simPricePerKg}
                    onChange={(e) => setSimPricePerKg(Number(e.target.value))}
                    className="w-full bg-black text-white border border-white p-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1">Category:</label>
                  <select
                    value={simCategory}
                    onChange={(e) => setSimCategory(e.target.value)}
                    className="w-full bg-black text-white border border-white p-2 focus:outline-none"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains">Grains</option>
                    <option value="Pulses">Pulses</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Quality Grade:</label>
                  <select
                    value={simGrade}
                    onChange={(e) => setSimGrade(e.target.value as any)}
                    className="w-full bg-black text-white border border-white p-2 focus:outline-none"
                  >
                    <option value="PREMIUM">PREMIUM</option>
                    <option value="GRADE_A">GRADE_A</option>
                    <option value="GRADE_B">GRADE_B</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Product Photo URL (Optional or pick preset):</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/... or auto-resolved from crop"
                    value={simImageUrl}
                    onChange={(e) => setSimImageUrl(e.target.value)}
                    className="flex-1 bg-black text-white border border-white p-2 focus:outline-none text-[11px]"
                  />
                  {simImageUrl && (
                    <img 
                      src={simImageUrl} 
                      alt="Preview" 
                      className="w-9 h-9 object-cover rounded border border-white shrink-0" 
                      onError={() => setSimImageUrl('')}
                    />
                  )}
                </div>
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[
                    { name: 'Tomato', img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80' },
                    { name: 'Onion', img: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80' },
                    { name: 'Potato', img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80' },
                    { name: 'Sweet Corn', img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=80' },
                    { name: 'Wheat', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80' },
                    { name: 'Orange', img: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=500&auto=format&fit=crop&q=80' },
                  ].map(preset => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setSimCropName(preset.name);
                        setSimImageUrl(preset.img);
                      }}
                      className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px]"
                    >
                      +{preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 text-[11px] text-orange-300">
                ⚠️ Submission Rule: When submitted, product status will be set to <strong>PENDING_APPROVAL</strong>. It will be sent to Admin Moderation Queue and will NOT be visible to users until Admin accepts it.
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-orange-500 text-black font-black uppercase hover:bg-orange-400 transition-colors"
                >
                  Submit Product (As Farmer)
                </button>
                <button 
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
