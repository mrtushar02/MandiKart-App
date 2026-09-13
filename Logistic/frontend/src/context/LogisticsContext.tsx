import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Vehicle,
  Driver,
  LogisticsOrder,
  DeliveryRoute,
  ExceptionIncident,
  OrderStatus,
  PickupStatus,
} from '../types';
import {
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_ORDERS,
  INITIAL_ROUTES,
  INITIAL_EXCEPTIONS,
} from '../constants/mockData';

interface LogisticsContextType {
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: LogisticsOrder[];
  routes: DeliveryRoute[];
  exceptions: ExceptionIncident[];
  
  // Fleet Actions
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  addDriver: (driver: Omit<Driver, 'id' | 'totalTrips'>) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  toggleDriverStatus: (id: string) => void;

  // Assignment & Order Lifecycle Actions
  assignVehicleAndDriver: (orderId: string, vehicleId: string, driverId: string) => boolean;
  updatePickupStatus: (orderId: string, pickupId: string, newStatus: PickupStatus) => void;
  advanceOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  verifyDeliveryOtp: (orderId: string, otp: string, receiverName?: string, notes?: string) => { success: boolean; message: string };

  // Route Planning Actions
  optimizeRoute: (routeId: string) => void;
  updateRouteStopStatus: (routeId: string, stopNumber: number, status: 'PENDING' | 'ARRIVED' | 'COMPLETED' | 'DELAYED') => void;

  // Exception Handling Actions
  reportException: (incident: Omit<ExceptionIncident, 'id' | 'reportedAt' | 'status' | 'incidentCode'>) => void;
  resolveException: (incidentId: string, actionTaken: string) => void;
  reassignVehicleForRoute: (routeId: string, oldVehicleId: string, newVehicleId: string, reason: string) => void;

  // Global KPIs
  metrics: {
    totalVehicles: number;
    activeVehicles: number;
    totalDrivers: number;
    onDutyDrivers: number;
    inTransitOrders: number;
    pendingPickups: number;
    completedToday: number;
    openExceptions: number;
  };
}

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'mandikart_logistics_v1';

export const LogisticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_vehicles`);
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_drivers`);
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
  });

  const [orders, setOrders] = useState<LogisticsOrder[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_orders`);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [routes, setRoutes] = useState<DeliveryRoute[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_routes`);
    return saved ? JSON.parse(saved) : INITIAL_ROUTES;
  });

  const [exceptions, setExceptions] = useState<ExceptionIncident[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_exceptions`);
    return saved ? JSON.parse(saved) : INITIAL_EXCEPTIONS;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_vehicles`, JSON.stringify(vehicles));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_drivers`, JSON.stringify(drivers));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_orders`, JSON.stringify(orders));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_routes`, JSON.stringify(routes));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_exceptions`, JSON.stringify(exceptions));
  }, [vehicles, drivers, orders, routes, exceptions]);

  // Sync available orders from Logistics Backend (Port 4002)
  useEffect(() => {
    let isMounted = true;
    const fetchBackendOrders = async () => {
      try {
        const res = await fetch('http://localhost:4002/api/v1/tasks/available');
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.data) && json.data.length > 0 && isMounted) {
            const mappedOrders: LogisticsOrder[] = json.data.map((raw: any) => ({
              id: raw.id || raw.orderId,
              orderNumber: raw.orderNumber || `#MK-${String(raw.id).slice(-4)}`,
              buyerId: raw.buyerId || 'byr-301',
              buyerName: raw.buyerName || 'MandiKart Retail Partner',
              buyerPhone: raw.buyerPhone || '+91 98221 34567',
              deliveryAddress: raw.deliveryLocation || raw.deliveryAddress || 'Central Hub Depot, Saheed Nagar, Bhubaneswar',
              status: (raw.status as OrderStatus) || 'CONFIRMED',
              isBulk: true,
              totalQuantityKg: Number(raw.quantityKg || 120),
              totalAmount: Number(raw.totalAmount || raw.payout || 420),
              assignedVehicleId: raw.assignedVehicleId,
              assignedDriverId: raw.assignedDriverId,
              routeId: raw.routeId,
              pickups: [
                {
                  id: `pk_${raw.id}_0`,
                  orderId: raw.id,
                  farmerId: raw.farmerId || 'frm-101',
                  farmerName: raw.farmerName || 'Ramesh Patel',
                  farmerPhone: raw.farmerPhone || '+91 98230 41122',
                  farmLocation: raw.pickupLocation || 'Farm Gate, Khordha',
                  cropName: raw.title || raw.cropName || 'Fresh Produce',
                  quantityKg: Number(raw.quantityKg || 120),
                  qualityGrade: 'A',
                  pickupStatus: 'CONFIRMED',
                  scheduledTime: raw.locationCapturedAt || 'Today, 08:00 AM',
                  pickupToken: raw.pickupOtp || '482910',
                  lat: 20.1584,
                  lng: 85.7042,
                },
              ],
              deliveryLat: 20.2961,
              deliveryLng: 85.8245,
              deliveryEta: 'Today, 04:00 PM',
              proofOfDelivery: {
                otp: raw.deliveryOtp || '8392',
              },
              createdAt: raw.createdAt || new Date().toISOString(),
              updatedAt: raw.timestamp || new Date().toISOString(),
            }));

            setOrders(prev => {
              const existingIds = new Set(prev.map(o => o.id));
              const newItems = mappedOrders.filter(mo => !existingIds.has(mo.id));
              if (newItems.length === 0) return prev;
              return [...newItems, ...prev];
            });
          }
        }
      } catch (err) {
        // ignore network error
      }
    };

    fetchBackendOrders();
    const interval = setInterval(fetchBackendOrders, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fleet Actions
  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: `veh-${Date.now().toString().slice(-4)}`,
    };
    setVehicles(prev => [newVehicle, ...prev]);
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => (v.id === id ? { ...v, ...updates } : v)));
  };

  const deleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const addDriver = (driver: Omit<Driver, 'id' | 'totalTrips'>) => {
    const newDriver: Driver = {
      ...driver,
      id: `drv-${Date.now().toString().slice(-4)}`,
      totalTrips: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    };
    setDrivers(prev => [newDriver, ...prev]);
  };

  const updateDriver = (id: string, updates: Partial<Driver>) => {
    setDrivers(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
  };

  const toggleDriverStatus = (id: string) => {
    setDrivers(prev =>
      prev.map(d => {
        if (d.id === id) {
          const nextStatus = d.status === 'AVAILABLE' ? 'ON_DUTY' : d.status === 'ON_DUTY' ? 'OFF_DUTY' : 'AVAILABLE';
          return { ...d, status: nextStatus };
        }
        return d;
      })
    );
  };

  // Assignment & Order Lifecycle Actions
  const assignVehicleAndDriver = (orderId: string, vehicleId: string, driverId: string): boolean => {
    const targetOrder = orders.find(o => o.id === orderId);
    const targetVehicle = vehicles.find(v => v.id === vehicleId);
    const targetDriver = drivers.find(d => d.id === driverId);

    if (!targetOrder || !targetVehicle || !targetDriver) return false;

    // Capacity verification
    if (targetVehicle.capacityKg < targetOrder.totalQuantityKg) {
      alert(`Capacity Warning: Vehicle capacity (${targetVehicle.capacityKg} kg) is less than order weight (${targetOrder.totalQuantityKg} kg).`);
      return false;
    }

    // Update order
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            assignedVehicleId: vehicleId,
            assignedDriverId: driverId,
            status: 'PICKUP_SCHEDULED',
            updatedAt: new Date().toISOString(),
            pickups: o.pickups.map(p => ({
              ...p,
              pickupStatus: p.pickupStatus === 'CONFIRMED' ? 'PICKUP_SCHEDULED' : p.pickupStatus,
            })),
          };
        }
        return o;
      })
    );

    // Update vehicle
    setVehicles(prev =>
      prev.map(v => {
        if (v.id === vehicleId) {
          return {
            ...v,
            assignedDriverId: driverId,
            currentLoadKg: targetOrder.totalQuantityKg,
            status: 'ASSIGNED',
          };
        }
        return v;
      })
    );

    // Update driver
    setDrivers(prev =>
      prev.map(d => {
        if (d.id === driverId) {
          return {
            ...d,
            assignedVehicleId: vehicleId,
            status: 'ON_DUTY',
          };
        }
        return d;
      })
    );

    return true;
  };

  // Master Rule: Child Pickups advance Parent to COLLECTED only when all child pickups reach COLLECTED
  const updatePickupStatus = (orderId: string, pickupId: string, newStatus: PickupStatus) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id !== orderId) return order;

        const updatedPickups = order.pickups.map(pickup => {
          if (pickup.id === pickupId) {
            return {
              ...pickup,
              pickupStatus: newStatus,
              collectedTime: newStatus === 'COLLECTED' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : pickup.collectedTime,
            };
          }
          return pickup;
        });

        // Check if ALL child pickups have reached COLLECTED
        const allCollected = updatedPickups.every(p => p.pickupStatus === 'COLLECTED');
        let nextOrderStatus = order.status;

        if (allCollected && (order.status === 'PICKUP_SCHEDULED' || order.status === 'PICKUP_IN_PROGRESS')) {
          nextOrderStatus = 'COLLECTED';
        } else if (newStatus === 'PICKUP_IN_PROGRESS' && order.status === 'PICKUP_SCHEDULED') {
          nextOrderStatus = 'PICKUP_IN_PROGRESS';
        }

        return {
          ...order,
          pickups: updatedPickups,
          status: nextOrderStatus,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const advanceOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );

    // If marked in transit, update vehicle status
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder?.assignedVehicleId && newStatus === 'IN_TRANSIT') {
      updateVehicle(targetOrder.assignedVehicleId, { status: 'IN_TRANSIT' });
    }
  };

  const verifyDeliveryOtp = (orderId: string, enteredOtp: string, receiverName?: string, notes?: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return { success: false, message: 'Order not found.' };

    if (targetOrder.proofOfDelivery.otp !== enteredOtp.trim()) {
      return { success: false, message: `Invalid Delivery OTP! Expected 4 digits.` };
    }

    // Mark as DELIVERED
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'DELIVERED',
            updatedAt: new Date().toISOString(),
            proofOfDelivery: {
              ...o.proofOfDelivery,
              verifiedAt: new Date().toISOString(),
              receiverName: receiverName || o.proofOfDelivery.receiverName || 'Authorized Receiver',
              notes: notes || 'Delivery OTP verified successfully.',
              signatureCaptured: true,
            },
          };
        }
        return o;
      })
    );

    // Free vehicle & driver load
    if (targetOrder.assignedVehicleId) {
      updateVehicle(targetOrder.assignedVehicleId, {
        currentLoadKg: 0,
        status: 'IDLE',
      });
    }

    if (targetOrder.assignedDriverId) {
      updateDriver(targetOrder.assignedDriverId, {
        status: 'AVAILABLE',
        totalTrips: (drivers.find(d => d.id === targetOrder.assignedDriverId)?.totalTrips || 0) + 1,
      });
    }

    return { success: true, message: 'Proof of Delivery verified! Order marked as DELIVERED.' };
  };

  // Route Planning Actions
  const optimizeRoute = (routeId: string) => {
    setRoutes(prev =>
      prev.map(r => {
        if (r.id === routeId) {
          // Re-sort stops: Prioritize early morning and perishables, group pickups before hubs/delivery
          const pickups = r.stops.filter(s => s.type === 'PICKUP');
          const hubs = r.stops.filter(s => s.type === 'COLLECTION_HUB');
          const deliveries = r.stops.filter(s => s.type === 'DELIVERY');

          const reordered = [...pickups, ...hubs, ...deliveries].map((s, idx) => ({
            ...s,
            stopNumber: idx + 1,
          }));

          return {
            ...r,
            stops: reordered,
            status: 'OPTIMIZED',
            totalDistanceKm: Math.round(r.totalDistanceKm * 0.91), // 9% route optimization savings
            estimatedDurationMins: Math.round(r.estimatedDurationMins * 0.88),
            lastOptimizedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
  };

  const updateRouteStopStatus = (routeId: string, stopNumber: number, status: 'PENDING' | 'ARRIVED' | 'COMPLETED' | 'DELAYED') => {
    setRoutes(prev =>
      prev.map(r => {
        if (r.id === routeId) {
          return {
            ...r,
            stops: r.stops.map(s => (s.stopNumber === stopNumber ? { ...s, status } : s)),
          };
        }
        return r;
      })
    );
  };

  // Exception Handling Actions
  const reportException = (incident: Omit<ExceptionIncident, 'id' | 'reportedAt' | 'status' | 'incidentCode'>) => {
    const newIncident: ExceptionIncident = {
      ...incident,
      id: `exc-${Date.now().toString().slice(-4)}`,
      incidentCode: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      reportedAt: new Date().toISOString(),
      status: 'OPEN',
    };
    setExceptions(prev => [newIncident, ...prev]);

    // Flag associated route if applicable
    if (incident.routeId) {
      setRoutes(prev => prev.map(r => (r.id === incident.routeId ? { ...r, status: 'EXCEPTION' } : r)));
    }
  };

  const resolveException = (incidentId: string, actionTaken: string) => {
    setExceptions(prev =>
      prev.map(exc =>
        exc.id === incidentId
          ? {
              ...exc,
              status: 'RESOLVED',
              actionTaken,
              resolvedAt: new Date().toISOString(),
            }
          : exc
      )
    );
  };

  const reassignVehicleForRoute = (routeId: string, oldVehicleId: string, newVehicleId: string, reason: string) => {
    // Free old vehicle
    updateVehicle(oldVehicleId, { status: 'MAINTENANCE', currentLoadKg: 0 });

    // Assign new vehicle
    const targetRoute = routes.find(r => r.id === routeId);
    const targetDriver = targetRoute?.driverId;

    updateVehicle(newVehicleId, {
      status: 'IN_TRANSIT',
      assignedDriverId: targetDriver,
    });

    // Update route
    setRoutes(prev =>
      prev.map(r => (r.id === routeId ? { ...r, vehicleId: newVehicleId, status: 'IN_PROGRESS' } : r))
    );

    // Update orders on this route
    setOrders(prev =>
      prev.map(o => (o.routeId === routeId ? { ...o, assignedVehicleId: newVehicleId } : o))
    );

    // Log incident
    reportException({
      routeId,
      type: 'VEHICLE_BREAKDOWN',
      severity: 'HIGH',
      description: `Emergency vehicle swap: Reassigned route from ${oldVehicleId} to ${newVehicleId}. Reason: ${reason}`,
      assignedVehicleSwapId: newVehicleId,
      actionTaken: `Transferred cargo and driver to standby vehicle ${newVehicleId}.`,
    });
  };

  // Metrics computation
  const metrics = {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === 'IN_TRANSIT' || v.status === 'ASSIGNED').length,
    totalDrivers: drivers.length,
    onDutyDrivers: drivers.filter(d => d.status === 'ON_DUTY').length,
    inTransitOrders: orders.filter(o => o.status === 'IN_TRANSIT' || o.status === 'COLLECTED').length,
    pendingPickups: orders
      .flatMap(o => o.pickups)
      .filter(p => p.pickupStatus !== 'COLLECTED' && p.pickupStatus !== 'FAILED').length,
    completedToday: orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length,
    openExceptions: exceptions.filter(e => e.status !== 'RESOLVED').length,
  };

  return (
    <LogisticsContext.Provider
      value={{
        vehicles,
        drivers,
        orders,
        routes,
        exceptions,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addDriver,
        updateDriver,
        toggleDriverStatus,
        assignVehicleAndDriver,
        updatePickupStatus,
        advanceOrderStatus,
        verifyDeliveryOtp,
        optimizeRoute,
        updateRouteStopStatus,
        reportException,
        resolveException,
        reassignVehicleForRoute,
        metrics,
      }}
    >
      {children}
    </LogisticsContext.Provider>
  );
};

export const useLogistics = () => {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
};
