import { Button } from "./components/ui/button";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { CreateRoom } from "./pages/create-room";
import { Room } from "./pages/room";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";


const queryClient = new QueryClient()

export function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={ <CreateRoom />} index/>
          <Route path="/room" element={<Room />}/>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}


