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

  // Poll available tasks from Logistics Backend (Port 4002)
  React.useEffect(() => {
    let isMounted = true;
    const fetchBackendTasks = async () => {
      const endpoints = [
        'http://192.168.1.9:4002/api/v1/tasks/available',
        'http://localhost:4002/api/v1/tasks/available',
        'http://10.0.2.2:4002/api/v1/tasks/available',
      ];
      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const json = await res.json();
            if (json && Array.isArray(json.data) && isMounted) {
              const mapped = json.data.map((task) => ({
                id: task.id || task.orderId,
                title: task.title || task.cropName || 'Fresh Consignment',
                quantity: task.quantity || `${task.quantityKg || 100} kg`,
                payout: task.payout || 380,
                distanceKm: task.distanceKm || 9.5,
                pickupName: task.pickupName || task.farmerName || 'Farmer Gate Pickup',
                dropName: task.dropName || 'Mandi Hub Receiving',
                pickupLocation: task.pickupLocation || 'Farm Gate',
                deliveryLocation: task.deliveryLocation || 'Mandi Hub',
                pickupOtp: task.pickupOtp || '482910',
                deliveryOtp: task.deliveryOtp || '8392',
                status: task.status || 'CONFIRMED',
              }));
              if (mapped.length > 0) {
                setAvailableDeliveries(mapped);
              }
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
  }, []);

  const callLogisticApi = async (path, method = 'POST', body = null) => {
    const endpoints = [
      'http://192.168.1.9:4002/api/v1',
      'http://localhost:4002/api/v1',
      'http://10.0.2.2:4002/api/v1',
    ];
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
    return true;
  };

  const loginWithGoogle = (driverData) => {
    if (driverData?.user) {
      setPartnerProfile(prev => ({
        ...prev,
        id: driverData.user.id || prev.id,
        name: driverData.user.fullName || prev.name,
        email: driverData.user.email || prev.email,
        avatar: driverData.user.avatarUrl || prev.avatar,
        avatarUrl: driverData.user.avatarUrl || prev.avatarUrl,
        phone: driverData.user.phone || prev.phone,
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
    if (data?.fullName) {
      setPartnerProfile(prev => ({ ...prev, name: data.fullName }));
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

    const newActive = {
      id: order.id,
      title: order.title,
      quantity: order.quantity,
      payout: order.payout,
      status: 'PICKUP',
      currentStepIndex: 0,
      requiresColdStorage: false,
      estimatedTimeMins: 25,
      distanceKm: order.distanceKm,
      pickupOtp: order.pickupOtp || '482910',
      deliveryOtp: order.deliveryOtp || '8392',
      pickup: {
        name: order.pickupName,
        contactPerson: 'Farm Dispatch Coordinator',
        phone: '+91 94370 55443',
        address: `${order.pickupName}, Rural Mandi Corridor`,
        pin: '751024',
        time: 'Just now',
        isDone: false,
      },
      drop: {
        name: order.dropName,
        contactPerson: 'Receiving Officer',
        phone: '+91 94371 66778',
        address: `${order.dropName}, Produce Bay 4`,
        pin: '751019',
        time: 'In 35 mins',
        isDone: false,
      },
      manifest: [
        { item: order.title, crates: 4, weightKg: 120, grade: 'Verified Grade A' },
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
    } else if (activeDelivery.currentStepIndex === 1) {
      // Delivered to customer / Mandi hub
      const enteredOtp = otp || activeDelivery.deliveryOtp || '8392';
      callLogisticApi(`/tasks/${activeDelivery.id}/complete-delivery`, 'POST', {
        deliveryOtp: enteredOtp,
        recipientName: recipientName || activeDelivery.drop?.name || 'Mandi Hub Receiving',
        podImageUrl: podImageUrl || '',
      }).catch(() => {});

      const payoutAmount = activeDelivery.payout;
      const completedOrder = {
        id: activeDelivery.id,
        title: activeDelivery.title,
        quantity: activeDelivery.quantity,
        payout: payoutAmount,
        deliveredAt: 'Just now',
        customer: activeDelivery.drop.name,
        rating: 5,
      };

      setCompletedDeliveries(prev => [completedOrder, ...prev]);
      setTodayStats(prev => ({
        ...prev,
        earnings: prev.earnings + payoutAmount,
        deliveriesCompleted: prev.deliveriesCompleted + 1,
        distanceKm: parseFloat((prev.distanceKm + activeDelivery.distanceKm).toFixed(1)),
      }));

      setActiveDelivery(null);
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
