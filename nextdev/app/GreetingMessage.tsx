"use client";

import { useEffect, useState } from "react";

interface GreetingProps {
  username: string;
}

export default function GreetingMessage({ username }: GreetingProps) {
  const [greeting, setGreeting] = useState("Добро пожаловать");

  useEffect(() => {
    const currentHour = new Date().getHours();

    if (currentHour >= 5 && currentHour < 12) {
      setGreeting("Доброе утро");
    } else if (currentHour >= 12 && currentHour < 18) {
      setGreeting("Добрый день");
    } else {
      setGreeting("Добрый вечер");
    }
  }, []);

  return (
    <h1 className="text-2xl font-semibold">
      {greeting}, {username}!
    </h1>
  );
}
