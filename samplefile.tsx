'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';

import { Chatbot } from '@/components/Chatbot';
import {
  HorizontalServiceCard,
  ServiceItem,
} from '@/components/HorizontalServiceCard';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Calendar as CalendarIcon,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/utils';
import { verifyBranchCode } from '@/utils/branchVerification';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';
import { autoLogin, fetchToken } from '@/store/slices/userSlice';
import { fetchServiceData } from '../../store/slices/serviceSlice';
import { PageLoader } from '@/components/ui/page-loader';
import { getToday } from '@/utils/commonfunction';

const mapServiceData = (item: any) => {
  return {
    id: item._id,
    name: item.title,
    description: item.description || "",
    image: item.gallery?.[0] || "",
    images: item.gallery || [],
    price: Number(item.rateplans?.[0]?.rackrate?.rate?.base || 0),
    duration: item.duration,
    category: item.category || "general",
    maxParticipants: item.maxparticipants || 10,
    inclusions: item.inclusions || [],
    rates: item.rateplans?.map((rate: any) => ({
      id: rate.ratetypeid,
      name: rate.title,
      price: Number(rate.rackrate?.rate?.base || 0),
    })),
    sevenDayAvailability: item.sevenDayAvailability || [],
    timeslots: item.timeslots,
  };
};


const Service = ({ tenant, namePage }: { tenant: string; namePage: string }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const { serviceData, loading: serviceLoading, error: serviceError } = useAppSelector((state: RootState) => state.service);
  const { branchData, loading: branchLoading } = useAppSelector((state: RootState) => state.branch);
  const { member, isAuthenticated, loading: userLoading, keyToken } = useAppSelector((state: RootState) => state.user);
  const [selectedDate, setSelectedDate] = useState<Date>(getToday());
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  const fetchServices = () => {
    const payload = {
      type: namePage === "activities" ? "facility" : "service",
      bookingdate: selectedDate
        ? format(selectedDate, "yyyy-MM-dd") // ✅ API safe
        : format(new Date(), "yyyy-MM-dd"),
    };

    dispatch(fetchServiceData(payload));
  };

  useEffect(() => {
    if (!branchData?._id) return;

    let isMounted = true;

    const init = async () => {
      try {
        let currentToken = keyToken?.token;

        if (!currentToken) {
          const res = await dispatch(
            fetchToken({
              branchid: branchData._id,
              organizationid: branchData.organizationid,
            })
          ).unwrap();

          currentToken = res?.token;
        }

        if (!isMounted) return;

        // 🔥 Only login if NOT authenticated
        if (!isAuthenticated && currentToken) {
          try {
            await dispatch(autoLogin({ token: currentToken })).unwrap();
          } catch (autoLoginErr: any) {
            // If token expired, refetch and retry
            if (autoLoginErr?.message?.includes('expired') || autoLoginErr?.includes('expired')) {
              console.log('Token expired, refetching...');
              const res = await dispatch(
                fetchToken({
                  branchid: branchData._id,
                  organizationid: branchData.organizationid,
                })
              ).unwrap();
              currentToken = res?.token;
              if (currentToken) {
                await dispatch(autoLogin({ token: currentToken })).unwrap();
              }
            } else {
              throw autoLoginErr;
            }
          }
        }

        if (!isMounted) return;

        fetchServices();

      } catch (err) {
        console.error("Initialization failed:", err);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [
    branchData?._id,
    branchData?.organizationid,
    dispatch
  ]);

  const categories = useMemo(() => {
    if (!serviceData?.data) return [];

    const unique = new Set(
      serviceData?.data?.map((s: any) => s.category).filter(Boolean)
    );

    return Array.from(unique);
  }, [serviceData?.data]);

  const filteredServices = useMemo(() => {
    if (!serviceData?.data) return [];

    const filtered = serviceData.data.filter((service: any) => {
      if (namePage === "activities") {
        return service.type === "facility";
      } else {
        return service.type === "service";
      }
    });

    const mapped = filtered.map(mapServiceData);

    return mapped.filter((service: any) => {
      if (categoryFilter.length && !categoryFilter.includes(service.category))
        return false;

      return true;
    });
  }, [serviceData?.data, categoryFilter]);


  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-purple-100 text-purple-800',
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-pink-100 text-pink-800',
    ];

    const index = category.length % colors.length;

    return colors[index];
  };


  const toggleCategory = (cat: string) => {
    setCategoryFilter((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {(serviceLoading || branchLoading || userLoading) && <PageLoader />}
      {/* Hero Search Bar */}
      <div
        className="relative py-10 px-6 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(80, 40, 80, 0.85), rgba(100, 60, 100, 0.75)), url('https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&q=80')`,
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground text-center mb-2">
            {namePage === "activities" ? "Activities & Experiences" : "Services & Wellness"}
          </h1>
          <p className="text-primary-foreground/80 text-center mb-6">
            {namePage === "activities" ? "Discover exciting activities and experiences" : "Indulge in our world-class spa treatments and rejuvenate your body and mind"}
          </p>

          <div className="bg-card/95 backdrop-blur-sm rounded-xl p-3 shadow-elevated flex flex-col md:flex-row items-center justify-center gap-3">
            {/* Date Picker */}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 justify-start gap-2 min-w-[200px] text-sm"
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {selectedDate ? (
                    <span>{format(selectedDate, 'MMM dd, yyyy')}</span>
                  ) : (
                    <span>Select Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return;

                    const normalized = new Date(date.setHours(0, 0, 0, 0));
                    setSelectedDate(normalized);
                    setOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>

            <Button onClick={fetchServices} disabled={!selectedDate || serviceLoading} className="h-10 px-6 bg-gradient-ocean text-sm">
              Search {namePage === "activities" ? "Activities" : "Services"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">
              {filteredServices?.length ?? 0}
            </span>{' '}
            {namePage === "activities" ? "Activitie" : "Service"}{(filteredServices?.length ?? 0) !== 1 ? 's' : ''} available
          </p>

          <div className="flex items-center gap-3">
            {/* Filter Drawer */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {categoryFilter.length > 0 && (
                    <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                      {categoryFilter.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>

              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter {namePage === "activities" ? "Activities" : "Services"}</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Category</h4>

                    <div className="space-y-2">
                      {categories.map((cat, i) => (
                        <label
                          key={i}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={categoryFilter.includes(cat)}
                            onCheckedChange={() => toggleCategory(cat)}
                          />
                          <span className="capitalize">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setCategoryFilter([])}
                  >
                    Clear Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Service Listings */}
        <div className="space-y-4">
          {filteredServices?.map((service: any) => (
            <HorizontalServiceCard
              namePage={namePage}
              tenant={tenant}
              key={service.id}
              service={service}
              type="spa"
              selectedDate={selectedDate}
              timeSlots={service.timeslots || []}
              getCategoryColor={getCategoryColor}
              isSingleRate={service.rates?.length === 1}
            />
          ))}
        </div>

        {filteredServices?.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No {namePage === "activities" ? "activities" : "services"} found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setCategoryFilter([])}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <Chatbot />
    </div>
  );
};

export default Service;
