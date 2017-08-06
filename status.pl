#!/usr/bin/env perl

use v5.12;
use strict;
use warnings;

use lib qw(./lib);

use JVC;
use Getopt::Long;

use Data::Dumper;

my $host;
my $session;

GetOptions("host|h=s" => \$host,
           "session|s=s" => \$session);

die "host needs to be given" unless $host;

my $j = JVC->new(host => $host, session => $session);

my $r = $j->cmd("GetCamStatus");

sub dump_slot {
	my ($name, $slot) = @_;

	say "SD card slot ${name}:";

	my $pretty_status;
	if ($slot->{Status} eq 'SelectRec') {
		$pretty_status = "recording";
	} elsif ($slot->{Status} eq 'NoSelect') {
		$pretty_status = "idle";
	} else {
		$pretty_status = "unknown ($slot->{Status})";
	}

	say " Status: " . $pretty_status;
	say " Remaining: " . $slot->{Remain} . " min";
}

dump_slot(A => $r->{SlotA});
dump_slot(B => $r->{SlotB});
