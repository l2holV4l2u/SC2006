import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, User, LogOut, Heart, TrendingUp } from "lucide-react";
import { signOut } from "next-auth/react";

export function Navbar() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-b border-white/10">
      <nav className="container flex items-center justify-between py-4 px-6">
        <Link
          href="/"
          className="font-semibold text-lg text-white drop-shadow-lg"
        >
          Resale Viewer
        </Link>
        <div className="flex gap-4">
          <Link href="/">
            <Button variant="ghost" className="text-white">
              Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white">
              Dashboard
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="highlight">Login</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function DashboardNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 w-full">
      <nav className="container flex items-center justify-between py-3 px-6 mx-auto max-w-6xl justify-self-center">
        {/* Logo Section */}
        <div className="flex items-center space-x-6">
          <Link
            href="/"
            className="font-semibold text-lg text-primary flex items-center"
          >
            <TrendingUp
              className="mr-2 text-primary"
              size={20}
              strokeWidth={3}
            />
            Resale Viewer
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-600 font-medium"
              >
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 px-0"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://i.pravatar.cc/32?img=11" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm text-gray-700">
                John Doe
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Heart className="mr-2 h-4 w-4" />
              Saved Properties
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="sm" className="md:hidden">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Button>
      </nav>
    </header>
  );
}
