import { Routes, Route, BrowserRouter } from "react-router-dom";
import { CreateRoom } from "./pages/create-room";
import { Room } from "./pages/room";
import { RecordRoomAudio } from "./pages/record-room-audio";
import { CreateRoomFromAudio } from "./pages/create-room-from-audio";
import { ActivityPage } from "./pages/activity";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";


const queryClient = new QueryClient()

export function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={ <CreateRoom />} index/>
          <Route path="/room/:id" element={<Room />} />
          <Route path="/audio/:id" element={<RecordRoomAudio />} />
          <Route path="/create-from-audio" element={<CreateRoomFromAudio />} />
          <Route path="/activity/:activityId" element={<ActivityPage />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}


