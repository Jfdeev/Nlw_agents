import { Button } from "./components/ui/button";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { CreateRoom } from "./pages/create-room";
import { Room } from "./pages/room";
import { RecordRoomAudio } from "./pages/record-room-audio";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";


const queryClient = new QueryClient()

export function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={ <CreateRoom />} index/>
          <Route path="/room/:id" element={<Room />} />
          <Route path="/audio" element={<RecordRoomAudio />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}


