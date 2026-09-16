import React, { createContext, useContext, useState } from 'react';
import {
  PARTNER_PROFILE,
  TODAY_STATS,
  ACTIVE_DELIVERY,
  AVAILABLE_DELIVERIES,
  COMPLETED_DELIVERIES,
  WEEKLY_EARNINGS,
  PAYOUT_HISTORY,
  LEADERBOARD,
  NOTIFICATIONS,
} from '../constants/partnerMockData';

const PartnerContext = createContext(null);

export const PartnerProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [partnerProfile, setPartnerProfile] = useState(PARTNER_PROFILE);
  const [todayStats, setTodayStats] = useState(TODAY_STATS);
  const [activeDelivery, setActiveDelivery] = useState(ACTIVE_DELIVERY);
  const [availableDeliveries, setAvailableDeliveries] = useState(AVAILABLE_DELIVERIES);
  const [completedDeliveries, setCompletedDeliveries] = useState(COMPLETED_DELIVERIES);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [weeklyEarnings, setWeeklyEarnings] = useState(WEEKLY_EARNINGS);
  const [payouts, setPayouts] = useState(PAYOUT_HISTORY);
  const [leaderboard, setLeaderboard] = useState(LEADERBOARD);

  // Quick navigation / screen arranger selector
  const [selectedScreenModalVisible, setSelectedScreenModalVisible] = useState(false);
  const [activeScreenOverride, setActiveScreenOverride] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Poll available tasks from Logistics Backend (Port 4002) with dynamic host resolution
  React.useEffect(() => {
    let isMounted = true;
    const fetchBackendTasks = async () => {
      const endpoints = [];
      if (typeof window !== 'undefined' && window.location?.hostname) {
        endpoints.push(`http://${window.location.hostname}:4002/api/v1/tasks/available`);
      }
      endpoints.push('http://localhost:4002/api/v1/tasks/available');
      endpoints.push('http://192.168.1.9:4002/api/v1/tasks/available');
      endpoints.push('http://10.0.2.2:4002/api/v1/tasks/available');

      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const json = await res.json();
            if (json && Array.isArray(json.data) && isMounted) {
              const mapped = json.data.map((task) => ({
                id: task.id || task.orderId,
                orderId: task.id || task.orderId,
                orderNumber: task.orderNumber || task.order_number || `#MK-${String(task.id).slice(-4)}`,
                title: task.title || task.cropName || 'Fresh Consignment',
                cropName: task.cropName || task.title || 'Fresh Produce',
                quantity: task.quantity || `${task.quantityKg || 100} kg`,
                quantityKg: task.quantityKg || (typeof task.quantity === 'string' ? parseInt(task.quantity) : 100) || 100,
                pricePerKg: task.pricePerKg || 32,
                totalPrice: task.totalPrice || task.totalAmount || 3200,
                totalAmount: task.totalAmount || task.totalPrice || 3200,
                payout: task.payout || 380,
                distanceKm: task.distanceKm || 9.5,
                estimatedTimeMins: task.estimatedTimeMins || 25,
                pickupName: task.pickupName || task.farmerName || 'Farmer Gate Pickup',
                dropName: task.dropName || 'Mandi Hub Receiving',
                pickupLocation: task.pickupLocation || 'Farm Gate',
                deliveryLocation: task.deliveryLocation || 'Mandi Hub',
                farmerName: task.farmerName || task.pickup?.contactPerson || 'Farmer Producer',
                farmerPhone: task.farmerPhone || task.pickup?.phone || '+91 94370 12345',
                dropContact: task.dropContact || task.drop?.contactPerson || 'Mandi Hub Manager',
                dropPhone: task.dropPhone || task.drop?.phone || '+91 94371 98765',
                pickupOtp: task.pickupOtp || '482910',
                deliveryOtp: task.deliveryOtp || '8392',
                status: task.status || 'CONFIRMED',
                pickup: task.pickup,
                drop: task.drop,
                manifest: task.manifest,
              }));
              const filtered = mapped.filter(m => !activeDelivery || (m.id !== activeDelivery.id && m.orderId !== activeDelivery.id));
              setAvailableDeliveries(filtered);
              break;
            }
          }
        } catch (e) {
          // ignore network attempt error and try next endpoint
        }
      }
    };

    fetchBackendTasks();
    const interval = setInterval(fetchBackendTasks, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeDelivery]);

  const callLogisticApi = async (path, method = 'POST', body = null) => {
    const endpoints = [];
    if (typeof window !== 'undefined' && window.location?.hostname) {
      endpoints.push(`http://${window.location.hostname}:4002/api/v1`);
    }
    endpoints.push('http://localhost:4002/api/v1');
    endpoints.push('http://192.168.1.9:4002/api/v1');
    endpoints.push('http://10.0.2.2:4002/api/v1');

    for (const base of endpoints) {
      try {
        const res = await fetch(`${base}${path}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        // try next endpoint
      }
    }
    return null;
  };

  // Auth methods
  const login = (mobileNumber, password) => {
    setIsAuthenticated(true);
    setIsOnline(true);
    if (mobileNumber) {
      setPartnerProfile(prev => ({
        ...prev,
        phone: mobileNumber.startsWith('+91') ? mobileNumber : `+91 ${mobileNumber}`,
      }));
    }
    return true;
  };

  const loginWithGoogle = (driverData) => {
    const user = driverData?.user || driverData?.profile;
    if (user) {
      setPartnerProfile(prev => ({
        ...prev,
        id: user.id || prev.id,
        name: user.fullName || user.name || prev.name,
        email: user.email || prev.email,
        avatar: user.avatarUrl || prev.avatar,
        avatarUrl: user.avatarUrl || prev.avatarUrl,
        phone: user.phone || prev.phone,
        badge: user.badge || prev.badge || 'Verified Google Partner',
        vehicle: {
          model: 'Tata Ace EV (750 kg)',
          plateNumber: 'OD-02-BX-4910',
          maxLoadKg: 750,
          ...(prev?.vehicle || {}),
        },
      }));
    }
    setIsAuthenticated(true);
    setIsOnline(true);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsOnline(false);
  };

  const registerPartner = (data) => {
    if (data) {
      setPartnerProfile(prev => ({
        ...prev,
        name: data.fullName || prev.name,
        phone: data.phone ? (data.phone.startsWith('+91') ? data.phone : `+91 ${data.phone}`) : prev.phone,
        vehicle: {
          model: data.selectedVehicle === '2_wheeler' ? 'Electric Bike (EV)' : data.selectedVehicle === '3_wheeler' ? 'Electric 3W Cargo' : 'Tata Ace EV (750 kg)',
          plateNumber: data.dlNumber || prev.vehicle?.plateNumber || 'OD-02-AX-9124',
          maxLoadKg: data.selectedVehicle === '2_wheeler' ? 120 : data.selectedVehicle === '3_wheeler' ? 450 : 750,
          ...(prev?.vehicle || {}),
        },
      }));
    }
    setIsAuthenticated(true);
    setIsOnline(true);
    return true;
  };

  // Toggle online status
  const toggleOnline = () => {
    setIsOnline(prev => !prev);
  };

  // Accept a new delivery
  const acceptDelivery = (orderId) => {
    const order = availableDeliveries.find(o => o.id === orderId);
    if (!order) return;

    callLogisticApi(`/tasks/${orderId}/start-pickup`, 'POST').catch(() => {});

    const quantityKg = Number(order.quantityKg || (typeof order.quantity === 'string' ? parseInt(order.quantity) : 100) || 100);
    const totalPrice = Number(order.totalPrice || order.totalAmount || (quantityKg * 32));
    const pricePerKg = Number(order.pricePerKg || (quantityKg > 0 ? Math.round(totalPrice / quantityKg) : 32));

    const newActive = {
      id: order.id,
      orderId: order.id,
      orderNumber: order.orderNumber || `#MK-${String(order.id).slice(-4)}`,
      title: order.title || order.cropName || 'Fresh Consignment',
      cropName: order.cropName || order.title || 'Fresh Consignment',
      quantity: order.quantity || `${quantityKg} kg`,
      quantityKg,
      pricePerKg,
      totalPrice,
      totalAmount: totalPrice,
      payout: order.payout || Math.max(380, Math.round(totalPrice * 0.08)),
      status: 'PICKUP',
      currentStepIndex: 0,
      requiresColdStorage: false,
      estimatedTimeMins: order.estimatedTimeMins || 25,
      distanceKm: order.distanceKm || 9.5,
      pickupOtp: order.pickupOtp || '482910',
      deliveryOtp: order.deliveryOtp || '8392',
      pickup: order.pickup || {
        name: order.pickupName || 'Farmgate Pickup',
        contactPerson: order.farmerName || 'Ramesh Patel',
        phone: order.farmerPhone || '+91 94370 12345',
        address: order.pickupLocation || `${order.pickupName || 'Ramesh Farm'}, Patia Green Corridor`,
        pin: '751024',
        time: 'Just now',
        isDone: false,
      },
      drop: order.drop || {
        name: order.dropName || 'Mandi Receiving Hub Gate 3',
        contactPerson: order.dropContact || 'Mandi Gate 3 Manager',
        phone: order.dropPhone || '+91 94371 98765',
        address: order.deliveryLocation || `${order.dropName || 'Bhubaneswar Central Mandi'}, Platform 3`,
        pin: '751019',
        time: 'In 35 mins',
        isDone: false,
      },
      manifest: order.manifest || [
        {
          item: order.title || order.cropName || 'Fresh Produce',
          crates: Math.ceil(quantityKg / 25),
          weightKg: quantityKg,
          grade: 'Grade A',
          pricePerKg,
          totalPrice,
        },
      ],
      otpCode: order.pickupOtp || '482910',
    };

    setActiveDelivery(newActive);
    setAvailableDeliveries(prev => prev.filter(o => o.id !== orderId));
  };

  // Decline an available delivery
  const declineDelivery = (orderId) => {
    setAvailableDeliveries(prev => prev.filter(o => o.id !== orderId));
  };

  // Explicit complete delivery & proof of delivery (POD)
  const completeActiveDelivery = (otp, recipientName, podImageUrl, finalWeightKg) => {
    if (!activeDelivery) return false;

    const enteredOtp = otp || activeDelivery.deliveryOtp || '8392';
    const orderId = activeDelivery.id || activeDelivery.orderId;
    const recipient = recipientName || activeDelivery.drop?.contactPerson || activeDelivery.drop?.name || 'Mandi Hub Receiving';
    const payoutAmount = Number(activeDelivery.payout) || 380;

    // Call backend endpoint to mark order as DELIVERED in OrderRegistry and trigger webhook
    callLogisticApi(`/tasks/${orderId}/complete-delivery`, 'POST', {
      deliveryOtp: enteredOtp,
      recipientName: recipient,
      podImageUrl: podImageUrl || '',
      weightKg: finalWeightKg || activeDelivery.quantityKg || 120,
    }).catch((err) => {
      console.warn('Failed to call complete-delivery on backend:', err);
    });

    const completedOrder = {
      id: orderId,
      orderNumber: activeDelivery.orderNumber || `#MK-${String(orderId).slice(-4)}`,
      title: activeDelivery.title || activeDelivery.cropName || 'Fresh Produce',
      quantity: activeDelivery.quantity || `${activeDelivery.quantityKg || 100} kg`,
      payout: payoutAmount,
      totalPrice: activeDelivery.totalPrice || activeDelivery.totalAmount,
      deliveredAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      customer: recipient,
      recipientName: recipient,
      podImageUrl: podImageUrl || '',
      rating: 5,
    };

    setCompletedDeliveries(prev => [completedOrder, ...prev.filter(c => c.id !== orderId)]);
    setTodayStats(prev => ({
      ...prev,
      earnings: prev.earnings + payoutAmount,
      deliveriesCompleted: prev.deliveriesCompleted + 1,
      distanceKm: parseFloat(((prev.distanceKm || 0) + (activeDelivery.distanceKm || 8.5)).toFixed(1)),
    }));

    // Reset activeDelivery to null so the active delivery card disappears immediately
    setActiveDelivery(null);
    return true;
  };

  // Advance delivery lifecycle (Pickup -> In Transit -> Delivered)
  const advanceDeliveryStep = (otp, recipientName, podImageUrl) => {
    if (!activeDelivery) return;

    if (activeDelivery.currentStepIndex === 0) {
      // Picked up from farmer, now In Transit
      const enteredOtp = otp || activeDelivery.pickupOtp || '482910';
      callLogisticApi(`/tasks/${activeDelivery.id}/verify-pickup`, 'POST', { pickupOtp: enteredOtp })
        .then(() => {
          callLogisticApi(`/tasks/${activeDelivery.id}/start-transit`, 'POST').catch(() => {});
        })
        .catch(() => {});

      setActiveDelivery(prev => ({
        ...prev,
        status: 'IN_TRANSIT',
        currentStepIndex: 1,
        pickup: { ...prev.pickup, isDone: true },
        otpCode: prev.deliveryOtp || '8392',
      }));
    } else {
      // Final delivery step
      completeActiveDelivery(otp, recipientName, podImageUrl);
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <PartnerContext.Provider
      value={{
        isOnline,
        toggleOnline,
        partnerProfile,
        todayStats,
        activeDelivery,
        availableDeliveries,
        completedDeliveries,
        weeklyEarnings,
        payouts,
        leaderboard,
        notifications,
        markAllNotificationsRead,
        acceptDelivery,
        declineDelivery,
        advanceDeliveryStep,
        completeActiveDelivery,
        selectedScreenModalVisible,
        setSelectedScreenModalVisible,
        activeScreenOverride,
        setActiveScreenOverride,
        isAuthenticated,
        login,
        loginWithGoogle,
        logout,
        registerPartner,
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
};

export const usePartner = () => {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
};
