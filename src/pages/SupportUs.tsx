import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Heart, Gift, Star, Users, Music, Headphones, Share2, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

const SupportUs = () => {
  const [customAmounts, setCustomAmounts] = useState({
    "One-time Donation": "",
    "Monthly Support": ""
  });

  const handleOptionClick = (optionTitle: string, amount: string) => {
    setCustomAmounts(prev => ({
      ...prev,
      [optionTitle]: amount
    }));
  };

  const supportOptions = [
    {
      title: "One-time Donation",
      description: "Support our mission with a one-time contribution",
      icon: Heart,
      options: [
        { amount: "5", label: "Cup of Coffee" },
        { amount: "20", label: "Music Book" },
        { amount: "50", label: "New Strings" },
        { amount: "100", label: "Pro Supporter" },
      ],
      url: "https://ko-fi.com/saemstunes"
    },
    {
      title: "Monthly Support",
      description: "Become a regular supporter with monthly donations",
      icon: Star,
      options: [
        { amount: "10", label: "Friend" },
        { amount: "25", label: "Supporter" },
        { amount: "50", label: "Patron" },
        { amount: "100", label: "Benefactor" },
      ],
      url: "https://ko-fi.com/saemstunes"
    },
  ];

  const impactItems = [
    {
      icon: <Headphones className="h-8 w-8 text-gold" />,
      title: "Music Education for All",
      description: "Your support helps provide free music lessons to underprivileged students."
    },
    {
      icon: <Music className="h-8 w-8 text-gold" />,
      title: "Quality Content Creation",
      description: "Fund new tutorials, courses, and backing tracks for our growing community."
    },
    {
      icon: <Award className="h-8 w-8 text-gold" />,
      title: "Student Scholarships",
      description: "Help talented musicians access premium resources and mentorship."
    },
    {
      icon: <Share2 className="h-8 w-8 text-gold" />,
      title: "Community Building",
      description: "Support events and collaborations that bring musicians together."
    }
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 0.5 }
    })
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={0}
        >
          <h1 className="text-3xl font-proxima font-bold mb-2">Support Saem's Tunes</h1>
          <p className="text-muted-foreground">Help us continue our mission of making music education accessible and enjoyable for everyone.</p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={1}
        >
          <Card className="bg-gradient-to-br from-gold/10 to-background border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-gold" />
                A Message from Saem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-1/3">
                  <div className="aspect-square rounded-2xl overflow-hidden border-2 border-gold/30 mx-auto md:mx-0 max-w-[200px] shadow-2xl relative z-10 bg-background">
                    <img
                      src="/lovable-uploads/logo-icon-lg.webp"
                      alt="Saem"
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                </div>
                <div className="w-full md:w-2/3">
                  <p className="italic text-muted-foreground mb-4">
                    "Music has the incredible power to transform lives, build confidence, and create joy.
                    At Saem's Tunes, we believe everyone deserves access to quality music education regardless
                    of their background or circumstances."
                  </p>
                  <p className="mb-4">
                    I started this journey with a simple vision: to make learning music an enriching, accessible,
                    and enjoyable experience for everyone. Today, we've touched thousands of lives through our
                    teachings, but there's so much more we want to accomplish.
                  </p>
                  <p>
                    Your support helps us develop new educational content, offer scholarships to deserving students,
                    improve our platform, and expand our reach to underserved communities. Every contribution,
                    big or small, brings us closer to our goal of making quality music education accessible to all.
                  </p>
                  <div className="mt-4 text-right">
                    <p className="font-semibold">Saem</p>
                    <p className="text-sm text-muted-foreground">Founder, Saem's Tunes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={2}
        >
          {supportOptions.map((option) => (
            <Card key={option.title} className="h-full">
              <CardHeader>
                <div className="flex items-start gap-2">
                  <div className="bg-gold/10 p-2 rounded-md">
                    <option.icon className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <CardTitle>{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {option.options.map((item) => (
                    <div
                      key={item.label}
                      className="border rounded-lg p-3 text-center hover:border-gold hover:bg-gold/5 cursor-pointer transition-all"
                      onClick={() => handleOptionClick(option.title, item.amount)}
                    >
                      <div className="text-xl font-semibold">${item.amount}</div>
                      <div className="text-sm text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium text-foreground">Custom Amount</label>
                  <div className="flex mt-1">
                    <div className="bg-muted text-foreground px-3 py-2 border border-r-0 rounded-l-md dark:bg-muted dark:text-foreground">
                      $
                    </div>
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-gold/50 
                      bg-background text-foreground dark:bg-background dark:text-foreground"
                      placeholder="Enter amount"
                      value={customAmounts[option.title] || ''}
                      onChange={(e) => setCustomAmounts(prev => ({
                        ...prev,
                        [option.title]: e.target.value
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-gold hover:bg-gold-dark"
                  onClick={() => window.open(`${option.url}?amount=${customAmounts[option.title] || ''}`, '_blank')}
                >
                  Donate {option.title === 'One-time Donation' ? 'Now' : 'Monthly'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={3}
        >
          <h2 className="text-2xl font-proxima font-semibold mb-4">Other Ways to Support Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-gold" />
                  Instrument Donations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Donate your gently used instruments to help students who don't have access to musical equipment.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gold" />
                  Volunteer with Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Share your skills and time to help with teaching, events, or platform development.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    window.open(
                      "mailto:contact@saemstunes.com?cc=saem@saemstunes.com&subject=I%27d%20Like%20To%20Volunteer&body=Dear%20Saem,%0A%0AThis%20is%20my%20formal%20request%20to%20register%20my%20interest%20as%20a%20volunteer%20with%20the%20Saem%27s%20Tunes%20fraternity.%20My%20skills%20are...",
                      "_blank"
                    )
                  }
                >
                  Join as Volunteer
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-gold" />
                  Spread the Word
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Share our platform with your network and help us reach more music lovers & enthusiasts alike.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('https://linktr.ee/saemstunes', '_blank')}
                >
                  Share Saem's Tunes
                </Button>
              </CardFooter>
            </Card>
          </div>
        </motion.div>

        <motion.div
          className="bg-muted p-6 rounded-lg mt-8"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={4}
        >
          <h2 className="text-xl font-proxima font-semibold mb-6">Your Donation Makes a Difference</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {impactItems.map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center p-3 bg-background/50 rounded-lg">
                <div className="p-3 bg-gold/10 rounded-full mb-3">
                  {item.icon}
                </div>
                <h3 className="font-medium text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
          <Separator className="my-6" />
          <p className="text-center text-muted-foreground">
            Every contribution helps us bring music education to those who need it most.
            Thank you for supporting our mission!
          </p>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default SupportUs;
